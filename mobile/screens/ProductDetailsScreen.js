import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { useMobile } from '../context';

const { width } = Dimensions.get('window');

const fallbackProducts = [
  {
    _id: 'p1',
    name: 'Royale Jaipur Gota Patti Saree',
    description: 'A breathtaking royal georgette saree, hand-embellished by Jaipur heritage artisans. Features detailed gota-patti embroidery borders, traditional hand-block floral motifs, and delicate hand-stitched gold sequins. Fits elegantly for festive banquets and weddings.',
    price: 18999,
    discountPrice: 14999,
    category: 'Handcrafted Sarees',
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500'],
    sizes: ['Free Size'],
    rating: 4.9,
    isTrending: true
  },
  {
    _id: 'p2',
    name: 'Heritage Leheriya Silk Anarkali',
    description: 'This royal tie-dye Leheriya Anarkali suit set is crafted from pure hand-loomed Banarasi silk. Embellished with fine mirror embroidery and gold zardozi work along the neck and flare. Includes matching churidar and a sheer chiffon dupatta.',
    price: 14499,
    discountPrice: 11999,
    category: 'Royal Anarkalis',
    images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500'],
    sizes: ['S', 'M', 'L', 'XL'],
    rating: 4.8,
    isTrending: true
  },
  {
    _id: 'p3',
    name: 'Shahi Zardozi Bridal Lehenga',
    description: 'A masterpiece of royal bridal couture. Tailored in pure mulberry raw silk with heavy zardozi, hand-woven gold dori, and real semi-precious bead embellishments. The flare is detailed with traditional palace arch motifs handcrafted by Jaipur master artisans over 300 hours.',
    price: 49999,
    discountPrice: 42999,
    category: 'Bridal & Festive',
    images: ['https://images.unsplash.com/photo-1593030103066-0093718efeb9?w=500'],
    sizes: ['S', 'M', 'L'],
    rating: 5.0,
    isTrending: true
  },
  {
    _id: 'p4',
    name: 'Sanganeri Print Peplum & Palazzo Set',
    description: 'A contemporary fusion coordinate set featuring Sanganeri handblock printed peplum top with hand-embellished dabka outlines, paired with lightweight floating georgette palazzo pants.',
    price: 8999,
    discountPrice: 6999,
    category: 'Jaipur Fusion Wear',
    images: ['https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500'],
    sizes: ['S', 'M', 'L', 'XL'],
    rating: 4.5,
    isFlashSale: true
  }
];

export default function ProductDetailsScreen({ route, navigation }) {
  const { productId } = route.params || {};
  const { API_HOST, addToCart, toggleWishlist, wishlist } = useMobile();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_HOST}/products/${productId}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
        } else {
          const mock = fallbackProducts.find((p) => p._id === productId);
          setProduct(mock || fallbackProducts[0]);
        }
      } catch (err) {
        console.warn('Backend server offline. Rendering default mock details.');
        const mock = fallbackProducts.find((p) => p._id === productId);
        setProduct(mock || fallbackProducts[0]);
      } finally {
        setLoading(false);
      }
    };
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#701122" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  const isLiked = wishlist.some((item) => item._id === product._id);
  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!selectedSize) {
      Alert.alert('Select Size', 'Please select a size before adding to cart.');
      return;
    }
    addToCart(product, selectedSize);
    Alert.alert('Added to Bag', `${product.name} (Size: ${selectedSize}) has been added to your shopping bag.`);
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Images Slideshow */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImageIdx(slide);
            }}
            scrollEventThrottle={16}
          >
            {product.images.map((imgUrl, idx) => (
              <Image key={idx} source={{ uri: imgUrl.startsWith('http') ? imgUrl : 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800' }} style={styles.productImage} />
            ))}
          </ScrollView>
          
          {/* Heart button */}
          <TouchableOpacity style={styles.wishlistFloat} onPress={handleToggleWishlist}>
            <Text style={[styles.heartIcon, isLiked && styles.heartActive]}>{isLiked ? '♥' : '♡'}</Text>
          </TouchableOpacity>
          
          {/* Indicator dots */}
          {product.images.length > 1 && (
            <View style={styles.indicatorContainer}>
              {product.images.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.indicatorDot,
                    activeImageIdx === idx ? styles.indicatorActive : styles.indicatorInactive
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Information */}
        <View style={styles.detailsBlock}>
          <Text style={styles.categoryTag}>{product.category}</Text>
          <Text style={styles.productTitle}>{product.name}</Text>

          <View style={styles.priceRow}>
            {product.discountPrice ? (
              <>
                <Text style={styles.discountPrice}>₹{product.discountPrice}</Text>
                <Text style={styles.originalPrice}>₹{product.price}</Text>
                <Text style={styles.savingBadge}>{discountPercent}% OFF</Text>
              </>
            ) : (
              <Text style={styles.discountPrice}>₹{product.price}</Text>
            )}
          </View>

          <View style={styles.ratingBadge}>
            <Text style={styles.starIcon}>★</Text>
            <Text style={styles.ratingText}>
              {product.rating || 4.5} ({product.numReviews || 12} reviews)
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Size Selection */}
        <View style={styles.sizeSection}>
          <View style={styles.htmlFlexRow}>
            <Text style={styles.sectionTitle}>Select Size</Text>
            <Text style={styles.sizeChartText}>Size Chart</Text>
          </View>
          <View style={styles.sizesList}>
            {product.sizes.map((sz) => {
              const isSelected = selectedSize === sz;
              return (
                <TouchableOpacity
                  key={sz}
                  style={[styles.sizeBubble, isSelected && styles.sizeBubbleSelected]}
                  onPress={() => setSelectedSize(sz)}
                >
                  <Text style={[styles.sizeText, isSelected && styles.sizeTextSelected]}>{sz}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Description Section */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Craftsmanship & Fabric Detailing</Text>
          <Text style={styles.descriptionContent}>{product.description}</Text>
          
          <View style={styles.heritageCallout}>
            <Text style={styles.heritageCalloutTitle}>👑 Jaipur Heritage Guarantee</Text>
            <Text style={styles.heritageCalloutText}>
              This designer couture item is crafted by certified master artisans in Jaipur, Rajasthan, using authentic traditional handwork and premium fabrics.
            </Text>
          </View>
        </View>

        {/* Brand highlights info */}
        <View style={styles.brandTrustSection}>
          <View style={styles.trustItem}>
            <Text style={styles.trustIcon}>🌸</Text>
            <Text style={styles.trustText}>Jaipur Made</Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={styles.trustIcon}>🚚</Text>
            <Text style={styles.trustText}>Free Express</Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={styles.trustIcon}>💎</Text>
            <Text style={styles.trustText}>100% Authentic</Text>
          </View>
        </View>
      </ScrollView>

      {/* Persistent Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.secondaryActionBtn} onPress={handleToggleWishlist}>
          <Text style={styles.secondaryActionBtnText}>
            {isLiked ? '❤️ WISHLISTED' : '♡ WISHLIST'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryActionBtn} onPress={handleAddToCart}>
          <Text style={styles.primaryActionBtnText}>ADD TO BAG</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2'
  },
  scrollContainer: {
    paddingBottom: 100
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF7F2'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF7F2'
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93'
  },
  imageContainer: {
    width: width,
    height: 420,
    position: 'relative',
    backgroundColor: '#FAF7F2'
  },
  productImage: {
    width: width,
    height: 420,
    resizeMode: 'cover'
  },
  wishlistFloat: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#701122',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  heartIcon: {
    fontSize: 22,
    color: '#2B1D20'
  },
  heartActive: {
    color: '#701122'
  },
  indicatorContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 15,
    width: '100%',
    justifyContent: 'center'
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3
  },
  indicatorActive: {
    backgroundColor: '#701122',
    width: 14
  },
  indicatorInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)'
  },
  detailsBlock: {
    paddingHorizontal: 20,
    paddingTop: 20
  },
  categoryTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#C5A059',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2B1D20',
    lineHeight: 26
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8
  },
  discountPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#701122'
  },
  originalPrice: {
    fontSize: 15,
    color: '#6C757D',
    textDecorationLine: 'line-through',
    marginLeft: 8
  },
  savingBadge: {
    fontSize: 14,
    color: '#C5A059',
    fontWeight: 'bold',
    marginLeft: 10
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 12,
    borderWidth: 0.5,
    borderColor: '#F5EFE6'
  },
  starIcon: {
    color: '#C5A059',
    fontSize: 14,
    marginRight: 4
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2B1D20'
  },
  divider: {
    height: 1,
    backgroundColor: '#F5EFE6',
    marginVertical: 18,
    marginHorizontal: 20
  },
  sizeSection: {
    paddingHorizontal: 20
  },
  htmlFlexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2B1D20',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  sizeChartText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#701122',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  sizesList: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  sizeBubble: {
    minWidth: 46,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FAF7F2',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }
  },
  sizeBubbleSelected: {
    borderColor: '#701122',
    backgroundColor: 'rgba(112, 17, 34, 0.05)'
  },
  sizeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C757D'
  },
  sizeTextSelected: {
    color: '#701122',
    fontWeight: 'bold'
  },
  descriptionSection: {
    paddingHorizontal: 20
  },
  descriptionContent: {
    fontSize: 13,
    color: '#554448',
    lineHeight: 21,
    marginTop: 8,
    fontWeight: '300'
  },
  heritageCallout: {
    backgroundColor: 'rgba(197, 160, 89, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginTop: 18,
    borderWidth: 0.5,
    borderColor: '#C5A059'
  },
  heritageCalloutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#701122',
    letterSpacing: 0.5
  },
  heritageCalloutText: {
    fontSize: 11,
    color: '#554448',
    lineHeight: 16,
    marginTop: 4,
    fontWeight: '300'
  },
  brandTrustSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 24,
    borderWidth: 0.5,
    borderColor: '#F5EFE6'
  },
  trustItem: {
    alignItems: 'center'
  },
  trustIcon: {
    fontSize: 18,
    marginBottom: 4
  },
  trustText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#C5A059',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 72,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F5EFE6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  secondaryActionBtn: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#701122',
    marginRight: 10
  },
  secondaryActionBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#701122',
    letterSpacing: 1
  },
  primaryActionBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#701122',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24
  },
  primaryActionBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FAF7F2',
    letterSpacing: 1
  }
});
