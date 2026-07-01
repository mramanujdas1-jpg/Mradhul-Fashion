import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, FlatList, TextInput, Alert, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { useMobile } from '../context';

const { width } = Dimensions.get('window');

export default function CartScreen({ navigation }) {
  const { cart, removeFromCart, updateCartQty, clearCart, user, API_HOST } = useMobile();
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');

  // Checkout modal states
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [processing, setProcessing] = useState(false);

  // Math
  const itemsPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = Math.round((itemsPrice * discountPercent) / 100);
  const taxPrice = Math.round((itemsPrice - discountAmount) * 0.18); // 18% GST
  const shippingPrice = itemsPrice - discountAmount > 1499 || itemsPrice === 0 ? 0 : 99; // Free over 1499
  const totalPrice = itemsPrice - discountAmount + taxPrice + shippingPrice;

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    if (!user?.token) {
      Alert.alert('Login Required', 'Please sign in before applying coupons.');
      return;
    }

    try {
      const response = await fetch(`${API_HOST}/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ code })
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Coupon Unavailable', data.message || 'This coupon is invalid or expired.');
        return;
      }
      setDiscountPercent(data.discountPercentage);
      setAppliedCoupon(`${data.code} (${data.discountPercentage}% OFF)`);
      Alert.alert('Coupon Applied', 'Your coupon has been applied securely.');
    } catch (error) {
      Alert.alert('Coupon Unavailable', 'Unable to validate coupons right now. Please try again.');
    }
    setCouponCode('');
  };

  const handleRemoveCoupon = () => {
    setDiscountPercent(0);
    setAppliedCoupon('');
  };

  const handleCheckoutSubmit = async () => {
    if (!name || !phone || !address || !city || !state || !pincode) {
      Alert.alert('Validation Error', 'Please fill in all shipping details.');
      return;
    }

    setProcessing(true);
    try {
      const orderData = {
        orderItems: cart,
        shippingAddress: {
          name,
          phone,
          streetAddress: address,
          city,
          state,
          postalCode: pincode
        },
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        isPaid: paymentMethod === 'Razorpay',
        paidAt: paymentMethod === 'Razorpay' ? new Date() : null,
        status: 'Pending'
      };

      const token = user?.token;
      if (!token) {
        Alert.alert('Login Required', 'Please sign in before placing an order.');
        setProcessing(false);
        return;
      }

      const response = await fetch(`${API_HOST}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to place order.');
      }

      Alert.alert(
        'Order Placed 🎉',
        `Thank you for shopping at Mradhul Fashion! Your order of ₹${totalPrice} has been successfully placed.`,
        [
          {
            text: 'OK',
            onPress: () => {
              clearCart();
              handleRemoveCoupon();
              setCheckoutVisible(false);
              navigation.navigate('Profile');
            }
          }
        ]
      );
    } catch (err) {
      Alert.alert('Checkout Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const renderCartItem = ({ item }) => {
    return (
      <View style={styles.cartItemCard}>
        <Image source={{ uri: item.image.startsWith('http') ? item.image : 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200' }} style={styles.itemImage} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.itemSize}>Size: {item.size}</Text>
          {item.color ? <Text style={styles.itemSize}>Color: {item.color}</Text> : null}
          <Text style={styles.itemPrice}>₹{item.price}</Text>

          {/* Quantity Controls */}
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateCartQty(item.product, item.size, item.qty - 1, item.color || '')}
            >
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyVal}>{item.qty}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateCartQty(item.product, item.size, item.qty + 1, item.color || '')}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeFromCart(item.product, item.size, item.color || '')}
            >
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🛍️</Text>
        <Text style={styles.emptyTitle}>Your Bag is Empty</Text>
        <Text style={styles.emptySubtitle}>Explore our luxury Jaipur collections and add your favorite outfits now.</Text>
        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.shopBtnText}>SHOP TRENDING</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Cart items list */}
        <FlatList
          data={cart}
          renderItem={renderCartItem}
          keyExtractor={(item, index) => `${item.product}-${item.size}-${item.color || 'default'}-${index}`}
          scrollEnabled={false}
          style={styles.itemList}
        />

        {/* Coupon input */}
        <View style={styles.couponBlock}>
          <Text style={styles.couponHeading}>Apply Promocode</Text>
          {appliedCoupon ? (
            <View style={styles.appliedCouponRow}>
              <Text style={styles.appliedCouponText}>✓ Coupon applied: {appliedCoupon}</Text>
              <TouchableOpacity onPress={handleRemoveCoupon}>
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInputRow}>
              <TextInput
                style={styles.couponInput}
                placeholder="Enter coupon code"
                placeholderTextColor="#8E8E93"
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCoupon}>
                <Text style={styles.applyBtnText}>APPLY</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Pricing details card */}
        <View style={styles.priceSummaryCard}>
          <Text style={styles.priceHeading}>Order Details</Text>

          <View style={styles.priceDetailRow}>
            <Text style={styles.priceLabel}>Bag Total</Text>
            <Text style={styles.priceVal}>₹{itemsPrice}</Text>
          </View>

          {discountAmount > 0 && (
            <View style={styles.priceDetailRow}>
              <Text style={styles.priceLabel}>Coupon Discount</Text>
              <Text style={[styles.priceVal, { color: '#4CAF50' }]}>-₹{discountAmount}</Text>
            </View>
          )}

          <View style={styles.priceDetailRow}>
            <Text style={styles.priceLabel}>GST (18%)</Text>
            <Text style={styles.priceVal}>₹{taxPrice}</Text>
          </View>

          <View style={styles.priceDetailRow}>
            <Text style={styles.priceLabel}>Delivery Charges</Text>
            <Text style={styles.priceVal}>
              {shippingPrice === 0 ? <Text style={{ color: '#4CAF50' }}>FREE</Text> : `₹${shippingPrice}`}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={[styles.priceDetailRow, { marginTop: 8 }]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalVal}>₹{totalPrice}</Text>
          </View>
        </View>

        {/* Secure Checkout details statement */}
        <View style={styles.secureBadgeRow}>
          <Text style={styles.secureIcon}>🔒</Text>
          <Text style={styles.secureText}>100% Safe and Secure Checkout</Text>
        </View>
      </ScrollView>

      {/* Checkout button at bottom */}
      <View style={styles.checkoutBar}>
        <View style={styles.totalPreviewBlock}>
          <Text style={styles.totalPreviewLabel}>Total</Text>
          <Text style={styles.totalPreviewPrice}>₹{totalPrice}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => setCheckoutVisible(true)}>
          <Text style={styles.checkoutBtnText}>PLACE ORDER</Text>
        </TouchableOpacity>
      </View>

      {/* Checkout Drawer Modal */}
      <Modal visible={checkoutVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delivery Details</Text>
              <TouchableOpacity onPress={() => setCheckoutVisible(false)}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput style={styles.formInput} value={name} onChangeText={setName} placeholder="Name" />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput style={styles.formInput} value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" />

              <Text style={styles.inputLabel}>Street Address</Text>
              <TextInput style={styles.formInput} value={address} onChangeText={setAddress} placeholder="Street Address" />

              <Text style={styles.inputLabel}>City</Text>
              <TextInput style={styles.formInput} value={city} onChangeText={setCity} placeholder="City" />

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>State</Text>
                  <TextInput style={styles.formInput} value={state} onChangeText={setState} placeholder="State" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Pincode</Text>
                  <TextInput style={styles.formInput} value={pincode} onChangeText={setPincode} placeholder="Pincode" keyboardType="number-pad" />
                </View>
              </View>

              {/* Payment Methods */}
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.paymentMethodRow}>
                <TouchableOpacity
                  style={[styles.payMethodCard, paymentMethod === 'COD' && styles.payMethodCardActive]}
                  onPress={() => setPaymentMethod('COD')}
                >
                  <Text style={styles.payIcon}>💵</Text>
                  <Text style={[styles.payText, paymentMethod === 'COD' && styles.payTextActive]}>Cash on Delivery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.payMethodCard, paymentMethod === 'Razorpay' && styles.payMethodCardActive]}
                  onPress={() => setPaymentMethod('Razorpay')}
                >
                  <Text style={styles.payIcon}>💳</Text>
                  <Text style={[styles.payText, paymentMethod === 'Razorpay' && styles.payTextActive]}>Razorpay (Prepaid)</Text>
                </TouchableOpacity>
              </View>

              {/* Final Place Order */}
              {processing ? (
                <ActivityIndicator size="large" color="#701122" style={{ marginVertical: 20 }} />
              ) : (
                <TouchableOpacity style={styles.submitOrderBtn} onPress={handleCheckoutSubmit}>
                  <Text style={styles.submitOrderBtnText}>
                    {paymentMethod === 'Razorpay' ? `PAY & CONFIRM (₹${totalPrice})` : `PLACE ORDER (₹${totalPrice})`}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2'
  },
  scrollContent: {
    paddingBottom: 90
  },
  itemList: {
    paddingHorizontal: 16,
    paddingTop: 16
  },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FAF7F2'
  },
  itemImage: {
    width: 80,
    height: 100,
    borderRadius: 10,
    resizeMode: 'cover'
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between'
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B1D20'
  },
  itemSize: {
    fontSize: 11,
    color: '#C5A059',
    fontWeight: '600',
    marginTop: 2
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#701122',
    marginTop: 4
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FAF7F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5EFE6'
  },
  qtyBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2B1D20'
  },
  qtyVal: {
    fontSize: 13,
    fontWeight: 'bold',
    marginHorizontal: 12,
    color: '#2B1D20'
  },
  removeBtn: {
    marginLeft: 'auto',
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93'
  },
  couponBlock: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F5EFE6'
  },
  couponHeading: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2B1D20',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  couponInputRow: {
    flexDirection: 'row'
  },
  couponInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#F5EFE6',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#2B1D20',
    backgroundColor: '#FAF7F2'
  },
  applyBtn: {
    backgroundColor: '#701122',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginLeft: 10,
    borderRadius: 8
  },
  applyBtnText: {
    color: '#FAF7F2',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  appliedCouponRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)'
  },
  appliedCouponText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600'
  },
  removeCouponText: {
    color: '#701122',
    fontSize: 11,
    fontWeight: 'bold'
  },
  priceSummaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F5EFE6'
  },
  priceHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2B1D20',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  priceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5
  },
  priceLabel: {
    fontSize: 12,
    color: '#6C757D'
  },
  priceVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2B1D20'
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F5EFE6',
    marginVertical: 8
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2B1D20'
  },
  totalVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#701122'
  },
  secureBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  secureIcon: {
    fontSize: 12,
    marginRight: 6
  },
  secureText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#FAF7F2'
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B1D20',
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24
  },
  shopBtn: {
    backgroundColor: '#701122',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24
  },
  shopBtnText: {
    color: '#FAF7F2',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1
  },
  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 72,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F5EFE6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between'
  },
  totalPreviewBlock: {
    justifyContent: 'center'
  },
  totalPreviewLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600'
  },
  totalPreviewPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#701122'
  },
  checkoutBtn: {
    backgroundColor: '#701122',
    height: 46,
    paddingHorizontal: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24
  },
  checkoutBtnText: {
    color: '#FAF7F2',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFE6'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2B1D20',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  closeModalText: {
    fontSize: 18,
    color: '#8E8E93',
    padding: 4
  },
  modalScroll: {
    padding: 16
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#C5A059',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  formInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#F5EFE6',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#2B1D20',
    marginBottom: 12,
    backgroundColor: '#FAF7F2'
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2B1D20',
    marginTop: 10,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  payMethodCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#F5EFE6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF'
  },
  payMethodCardActive: {
    borderColor: '#701122',
    backgroundColor: 'rgba(112, 17, 34, 0.03)'
  },
  payIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  payText: {
    fontSize: 11,
    color: '#6C757D',
    fontWeight: '600'
  },
  payTextActive: {
    color: '#701122',
    fontWeight: 'bold'
  },
  submitOrderBtn: {
    backgroundColor: '#701122',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  submitOrderBtnText: {
    color: '#FAF7F2',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1
  }
});
