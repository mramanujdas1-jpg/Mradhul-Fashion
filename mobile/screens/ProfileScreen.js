import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useMobile } from '../context';

export default function ProfileScreen({ navigation }) {
  const { user, login, logout, API_HOST } = useMobile();

  // Auth form states
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Orders and Profile data states
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'address'

  // Load orders if user is logged in
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API_HOST}/orders/myorders`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        throw new Error('Failed to fetch');
      }
    } catch (e) {
      setOrders([]);
      Alert.alert('Orders Unavailable', 'Unable to load your live order history right now.');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Validation Error', 'Please fill in all credentials.');
      return;
    }
 
    const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      Alert.alert('Configuration Error', 'Firebase Auth API Key (EXPO_PUBLIC_FIREBASE_API_KEY) is not set in environment variables.');
      return;
    }

    setAuthLoading(true);
    const endpoint = isLogin
      ? `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`
      : `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
 
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      });
 
      if (res.ok) {
        const fbData = await res.json();
        // Sync with the backend MongoDB using Firebase ID Token
        const syncRes = await fetch(`${API_HOST}/auth/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${fbData.idToken}`
          },
          body: JSON.stringify({
            cart: [],
            wishlist: []
          })
        });
 
        if (syncRes.ok) {
          const userData = await syncRes.json();
          login({ ...userData, token: fbData.idToken });
          Alert.alert('Success', `Logged in successfully as ${userData.name}`);
        } else {
          const errData = await syncRes.json();
          throw new Error(errData.message || 'Failed to sync with backend');
        }
      } else {
        const fbErr = await res.json();
        throw new Error(fbErr.error?.message || 'Authentication failed');
      }
    } catch (err) {
      Alert.alert('Authentication Error', err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const renderAuthForm = () => {
    return (
      <View style={styles.authContainer}>
        <View style={styles.brandSplash}>
          <Text style={styles.splashSubtitle}>WELCOME TO THE COUTURE BRAND</Text>
          <Text style={styles.splashTitle}>Mradhul Fashion</Text>
        </View>

        <View style={styles.authCard}>
          <Text style={styles.authCardTitle}>{isLogin ? 'Login to Couture' : 'Create Account'}</Text>

          {!isLogin && (
            <>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput
                style={styles.authInput}
                placeholder="Your Name"
                placeholderTextColor="#8E8E93"
                value={name}
                onChangeText={setName}
              />
            </>
          )}

          <Text style={styles.formLabel}>Email Address</Text>
          <TextInput
            style={styles.authInput}
            placeholder="you@example.com"
            placeholderTextColor="#8E8E93"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.formLabel}>Password</Text>
          <TextInput
            style={styles.authInput}
            placeholder="••••••••"
            placeholderTextColor="#8E8E93"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {authLoading ? (
            <ActivityIndicator size="large" color="#701122" style={{ marginVertical: 12 }} />
          ) : (
            <TouchableOpacity style={styles.authBtn} onPress={handleAuth}>
              <Text style={styles.authBtnText}>{isLogin ? 'SIGN IN' : 'REGISTER'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.toggleAuthBtn} onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.toggleAuthBtnText}>
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTrackingStep = (step, index, currentStatus, totalSteps) => {
    const statuses = ['Pending', 'Processing', 'Shipped', 'Out For Delivery', 'Delivered'];
    const currentIdx = statuses.indexOf(currentStatus);
    const stepIdx = statuses.indexOf(step.status);
    const isCompleted = stepIdx <= currentIdx;
    const isLast = index === totalSteps - 1;

    return (
      <View key={index} style={styles.trackingStepRow}>
        <View style={styles.stepIndicatorBlock}>
          <View style={[styles.stepCircle, isCompleted ? styles.stepCircleCompleted : styles.stepCirclePending]}>
            <Text style={styles.checkText}>{isCompleted ? '✓' : ''}</Text>
          </View>
          {!isLast && <View style={[styles.stepConnector, isCompleted ? styles.stepConnectorActive : styles.stepConnectorPending]} />}
        </View>
        <View style={styles.stepInfoBlock}>
          <Text style={[styles.stepTitle, isCompleted ? styles.stepTitleCompleted : styles.stepTitlePending]}>
            {step.status}
          </Text>
          <Text style={styles.stepDescription}>{step.description}</Text>
          <Text style={styles.stepTime}>{new Date(step.timestamp).toLocaleString()}</Text>
        </View>
      </View>
    );
  };

  const renderProfileDetails = () => {
    const addresses = user?.addresses || [
      {
        name: 'Devi Sharma',
        phone: '9998887776',
        streetAddress: 'Flat 402, Royal Residency, C-Scheme',
        city: 'Jaipur',
        state: 'Rajasthan',
        postalCode: '302001',
        isDefault: true
      }
    ];

    return (
      <ScrollView showsVerticalScrollIndicator={false} style={styles.profileContainer}>
        {/* User Card Header */}
        <View style={styles.profileHeaderCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' }}
            style={styles.avatar}
          />
          <View style={styles.userMeta}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.roleBadge}>{user.role === 'admin' ? '💎 ADMIN' : '👑 CLIENT'}</Text>
            </View>
          </View>
        </View>

        {/* Tab Controls */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'orders' && styles.tabBtnActive]}
            onPress={() => setActiveTab('orders')}
          >
            <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>MY ORDERS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'address' && styles.tabBtnActive]}
            onPress={() => setActiveTab('address')}
          >
            <Text style={[styles.tabText, activeTab === 'address' && styles.tabTextActive]}>ADDRESSES</Text>
          </TouchableOpacity>
        </View>

        {/* Content Panel */}
        {activeTab === 'orders' ? (
          <View style={styles.tabContentBlock}>
            {ordersLoading ? (
              <ActivityIndicator size="large" color="#701122" />
            ) : orders.length > 0 ? (
              orders.map((ord) => (
                <View key={ord._id} style={styles.orderHistoryCard}>
                  <View style={styles.orderCardHeader}>
                    <Text style={styles.orderIdText}>Order #{ord._id.substring(0, 8).toUpperCase()}</Text>
                    <Text style={[styles.orderStatusBadge, ord.status === 'Delivered' ? styles.statusDelivered : styles.statusShipped]}>
                      {ord.status.toUpperCase()}
                    </Text>
                  </View>

                  {/* Order items lists */}
                  {ord.orderItems.map((item, idx) => (
                    <View key={idx} style={styles.orderListItem}>
                      <Image source={{ uri: item.image }} style={styles.orderItemImage} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.orderItemName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.orderItemMeta}>
                          Qty: {item.qty} | Size: {item.size}{item.color ? ` | Color: ${item.color}` : ''}
                        </Text>
                      </View>
                      <Text style={styles.orderItemPrice}>₹{item.price * item.qty}</Text>
                    </View>
                  ))}

                  <View style={styles.orderCardDivider} />

                  {/* Tracking details */}
                  <View style={styles.trackingHeaderRow}>
                    <Text style={styles.trackingTitle}>Shipment Tracking Status</Text>
                    <Text style={styles.orderCostText}>Paid: ₹{ord.totalPrice}</Text>
                  </View>

                  {/* Stepper container */}
                  <View style={styles.trackingStepperBox}>
                    {ord.trackingSteps && ord.trackingSteps.length > 0 ? (
                      ord.trackingSteps.map((step, idx) =>
                        renderTrackingStep(step, idx, ord.status, ord.trackingSteps.length)
                      )
                    ) : (
                      <View style={styles.trackingStepRow}>
                        <View style={styles.stepIndicatorBlock}>
                          <View style={[styles.stepCircle, styles.stepCircleCompleted]}>
                            <Text style={styles.checkText}>✓</Text>
                          </View>
                        </View>
                        <View style={styles.stepInfoBlock}>
                          <Text style={styles.stepTitle}>Confirmed</Text>
                          <Text style={styles.stepDescription}>Your order is being processed for dispatch.</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyTabContent}>
                <Text style={styles.emptyTabText}>No orders placed yet.</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.tabContentBlock}>
            {addresses.map((addr, idx) => (
              <View key={idx} style={styles.addressCard}>
                <View style={styles.addressHeader}>
                  <Text style={styles.addressName}>{addr.name}</Text>
                  {addr.isDefault && <Text style={styles.defaultAddrBadge}>DEFAULT</Text>}
                </View>
                <Text style={styles.addressPhone}>📞 {addr.phone}</Text>
                <Text style={styles.addressDesc}>
                  {addr.streetAddress}, {addr.city}, {addr.state} - {addr.postalCode}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Logout action */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>LOG OUT</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {user ? renderProfileDetails() : renderAuthForm()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5'
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  brandSplash: {
    alignItems: 'center',
    marginBottom: 30
  },
  splashSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 3,
    marginBottom: 4
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#701122'
  },
  authCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  authCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1E',
    marginBottom: 18,
    textAlign: 'center'
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6C757D',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  authInput: {
    height: 42,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1A1A1E',
    marginBottom: 16,
    backgroundColor: '#FAF8F5'
  },
  authBtn: {
    backgroundColor: '#701122',
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  authBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1
  },
  toggleAuthBtn: {
    marginTop: 16,
    alignItems: 'center'
  },
  toggleAuthBtnText: {
    fontSize: 12,
    color: '#701122',
    fontWeight: '600'
  },
  profileContainer: {
    flex: 1,
    padding: 16
  },
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EBEBEB'
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#D4AF37'
  },
  userMeta: {
    marginLeft: 16,
    flex: 1
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1E'
  },
  profileEmail: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 6
  },
  roleBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#701122',
    backgroundColor: 'rgba(112, 17, 34, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginTop: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: '#EBEBEB'
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8
  },
  tabBtnActive: {
    backgroundColor: '#701122'
  },
  tabText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6C757D',
    letterSpacing: 0.5
  },
  tabTextActive: {
    color: '#FFFFFF'
  },
  tabContentBlock: {
    marginTop: 16
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EBEBEB'
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  addressName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1E'
  },
  defaultAddrBadge: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#D4AF37',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  addressPhone: {
    fontSize: 12,
    color: '#4E4E52',
    marginBottom: 4
  },
  addressDesc: {
    fontSize: 12,
    color: '#6C757D',
    lineHeight: 18
  },
  orderHistoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB'
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  orderIdText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A1A1E'
  },
  orderStatusBadge: {
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  statusDelivered: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    color: '#4CAF50'
  },
  statusShipped: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    color: '#D4AF37'
  },
  orderListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6
  },
  orderItemImage: {
    width: 40,
    height: 50,
    borderRadius: 4,
    resizeMode: 'cover'
  },
  orderItemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1E'
  },
  orderItemMeta: {
    fontSize: 10,
    color: '#6C757D',
    marginTop: 2
  },
  orderItemPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A1A1E'
  },
  orderCardDivider: {
    height: 1,
    backgroundColor: '#F5F5F7',
    marginVertical: 12
  },
  trackingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12
  },
  trackingTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A1A1E'
  },
  orderCostText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#701122'
  },
  trackingStepperBox: {
    paddingLeft: 4,
    marginTop: 8
  },
  trackingStepRow: {
    flexDirection: 'row',
    minHeight: 52
  },
  stepIndicatorBlock: {
    alignItems: 'center',
    width: 24
  },
  stepCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2
  },
  stepCircleCompleted: {
    backgroundColor: '#701122'
  },
  stepCirclePending: {
    backgroundColor: '#EBEBEB'
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold'
  },
  stepConnector: {
    width: 2,
    flex: 1,
    marginVertical: -2,
    zIndex: 1
  },
  stepConnectorActive: {
    backgroundColor: '#701122'
  },
  stepConnectorPending: {
    backgroundColor: '#EBEBEB'
  },
  stepInfoBlock: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 14
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  stepTitleCompleted: {
    color: '#1A1A1E'
  },
  stepTitlePending: {
    color: '#6C757D'
  },
  stepDescription: {
    fontSize: 10,
    color: '#6C757D',
    marginTop: 2
  },
  stepTime: {
    fontSize: 9,
    color: '#8E8E93',
    marginTop: 2
  },
  emptyTabContent: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyTabText: {
    fontSize: 13,
    color: '#8E8E93'
  },
  logoutBtn: {
    backgroundColor: '#1A1A1E',
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1
  }
});
