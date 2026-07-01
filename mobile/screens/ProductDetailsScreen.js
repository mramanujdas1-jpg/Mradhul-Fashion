import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { useMobile } from '../context';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen({ route, navigation }) {
  const { productId } = route.params || {};
  const { API_HOST, addToCart, toggleWishlist, wishlist, user } = useMobile();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Review states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_HOST}/products/${productId}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
          setReviews(data.reviews || []);
          if (data.product.sizes && data.product.sizes.length) {
            setSelectedSize(data.product.sizes[0]);
          }
          const variants = data.product.variantImages?.filter(variant => variant.color && variant.images?.length) || [];
          if (variants.length) {
            setSelectedColor(variants[0].color);
          } else if (data.product.colors && data.product.colors.length) {
            setSelectedColor(data.product.colors[0]);
          }
        } else {
          setProduct(null);
        }
      } catch (err) {
        setProduct(null);
        setReviews([]);
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
  const colorVariants = product.variantImages?.filter(variant => variant.color && variant.images?.length) || [];
  const availableColors = colorVariants.length ? colorVariants.map(variant => variant.color) : (product.colors || []);
  const selectedVariant = colorVariants.find(variant => variant.color === selectedColor);
  const displayImages = selectedVariant?.images?.length ? selectedVariant.images : (product.images || []);
  const hasStockValue = (value) => value !== undefined && value !== null && value !== '';
  const getStockForSelection = (size = selectedSize) => {
    const stockCandidates = [];
    if (hasStockValue(product.stock)) stockCandidates.push(Number(product.stock));
    if (size && hasStockValue(product.stockPerSize?.[size])) stockCandidates.push(Number(product.stockPerSize[size]));
    if (selectedVariant && hasStockValue(selectedVariant.stock)) stockCandidates.push(Number(selectedVariant.stock));
    if (selectedVariant && size && hasStockValue(selectedVariant.stockPerSize?.[size])) stockCandidates.push(Number(selectedVariant.stockPerSize[size]));
    const numericStock = stockCandidates.filter(value => Number.isFinite(value));
    return numericStock.length ? Math.min(...numericStock) : 0;
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      Alert.alert('Select Size', 'Please select a size before adding to cart.');
      return;
    }
    if (availableColors.length > 0 && !selectedColor) {
      Alert.alert('Select Color', 'Please select a color before adding to cart.');
      return;
    }
    const availableStock = getStockForSelection(selectedSize);
    if (availableStock <= 0) {
      Alert.alert('Out of Stock', 'This color and size combination is currently unavailable.');
      return;
    }
    addToCart(product, selectedSize, 1, selectedColor || '', displayImages[0] || product.images?.[0]);
    Alert.alert('Added to Bag', `${product.name} (${selectedColor ? `Color: ${selectedColor}, ` : ''}Size: ${selectedSize}) has been added to your shopping bag.`);
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
  };

  const handleHelpfulClick = async (reviewId) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to vote.');
      return;
    }
    try {
      const res = await fetch(`${API_HOST}/products/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      if (res.ok) {
        const refreshRes = await fetch(`${API_HOST}/products/${productId}`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setReviews(refreshData.reviews || []);
        }
      }
    } catch (err) {
      console.warn('Failed to vote:', err);
    }
  };

  const handleReviewSubmit = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to write a review.');
      return;
    }
    if (!reviewComment.trim()) {
      Alert.alert('Validation Error', 'Review comments cannot be empty.');
      return;
    }
    setSubmittingReview(true);
    const imagesArr = reviewImages
      .split(',')
      .map(url => url.trim())
      .filter(url => url.startsWith('http'));

    try {
      const res = await fetch(`${API_HOST}/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment, images: imagesArr })
      });
      if (res.ok) {
        Alert.alert('Success', 'Thank you for your review!');
        setReviewComment('');
        setReviewImages('');
        const refreshRes = await fetch(`${API_HOST}/products/${productId}`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setReviews(refreshData.reviews || []);
          if (refreshData.product) {
            setProduct(refreshData.product);
          }
        }
      } else {
        const data = await res.json();
        Alert.alert('Error', data.message || 'Failed to submit review.');
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to connect to the backend server.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Distribution calculations
  const starBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    if (starBreakdown[r.rating] !== undefined) starBreakdown[r.rating]++;
  });

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
            {displayImages.map((imgUrl, idx) => (
              <Image key={idx} source={{ uri: imgUrl.startsWith('http') ? imgUrl : 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800' }} style={styles.productImage} />
            ))}
          </ScrollView>
          
          {/* Heart button */}
          <TouchableOpacity style={styles.wishlistFloat} onPress={handleToggleWishlist}>
            <Text style={[styles.heartIcon, isLiked && styles.heartActive]}>{isLiked ? '♥' : '♡'}</Text>
          </TouchableOpacity>
          
          {/* Indicator dots */}
          {displayImages.length > 1 && (
            <View style={styles.indicatorContainer}>
              {displayImages.map((_, idx) => (
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
              {product.rating ? product.rating.toFixed(1) : '0.0'} ({product.numReviews || 0} reviews)
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Color Selection */}
        {availableColors.length > 0 && (
          <View style={styles.colorSection}>
            <Text style={styles.sectionTitle}>Select Color</Text>
            <View style={styles.colorsList}>
              {availableColors.map((color) => {
                const isSelected = selectedColor === color;
                return (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorCircle,
                      isSelected && styles.colorCircleSelected
                    ]}
                    onPress={() => {
                      setSelectedColor(color);
                      setActiveImageIdx(0);
                    }}
                    title={color}
                  >
                    <Text style={[styles.colorLabel, isSelected && styles.colorLabelSelected]}>{color}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {availableColors.length > 0 && <View style={styles.divider} />}

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
          
          <View style={styles.fabricDetailsBlock}>
            <View style={styles.fabricCol}>
              <Text style={styles.fabricLabel}>Fabric / Material</Text>
              <Text style={styles.fabricVal}>{product.fabricMaterial || 'Premium Silk & Cotton'}</Text>
            </View>
            <View style={styles.fabricCol}>
              <Text style={styles.fabricLabel}>SKU Code</Text>
              <Text style={styles.fabricVal}>{product.sku || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {product.specifications && product.specifications.length > 0 && (
          <View style={styles.divider} />
        )}

        {/* Specifications list */}
        {product.specifications && product.specifications.length > 0 && (
          <View style={styles.specsSection}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            <View style={styles.specsBox}>
              {product.specifications.map((spec, idx) => (
                <View key={idx} style={styles.specRow}>
                  <Text style={styles.specKey}>{spec.key}</Text>
                  <Text style={styles.specValue}>{spec.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.divider} />

        {/* Shipping & policies */}
        <View style={styles.policySection}>
          <Text style={styles.sectionTitle}>Shipping & Returns</Text>
          <View style={styles.policyBox}>
            <Text style={styles.policyText}>🚚 {product.deliveryInfo || 'Ships in 24-48 hours. Free express delivery.'}</Text>
            <Text style={styles.policyText}>🔄 {product.returnPolicy || '7-day standard returns. alter services available.'}</Text>
          </View>
        </View>

        {/* Heritage Callout */}
        <View style={styles.heritageCalloutBox}>
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

        <View style={styles.divider} />

        {/* Customer Reviews Section */}
        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>
          
          {/* Stars breakdown */}
          {reviews.length > 0 && (
            <View style={styles.ratingSummaryBox}>
              <View style={styles.ratingSummaryLeft}>
                <Text style={styles.avgRatingText}>{product.rating ? product.rating.toFixed(1) : '0.0'}</Text>
                <View style={styles.avgStarsRow}>
                  {[...Array(5)].map((_, i) => (
                    <Text key={i} style={[styles.starReviewIcon, i < Math.round(product.rating || 0) ? styles.starFilled : styles.starUnfilled]}>★</Text>
                  ))}
                </View>
                <Text style={styles.ratingsCountText}>{reviews.length} Ratings</Text>
              </View>
              <View style={styles.ratingSummaryRight}>
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = starBreakdown[stars] || 0;
                  const percent = Math.round((count / (reviews.length || 1)) * 100);
                  return (
                    <View key={stars} style={styles.progressRow}>
                      <Text style={styles.starLabelText}>{stars} ★</Text>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFilled, { width: `${percent}%` }]} />
                      </View>
                      <Text style={styles.percentText}>{percent}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Review write form */}
          {user && (
            <View style={styles.writeReviewBox}>
              <Text style={styles.writeReviewTitle}>Share Your Review</Text>
              <Text style={styles.reviewLabel}>Rating (1-5)</Text>
              <View style={styles.ratingInputRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                    <Text style={[styles.starInputIcon, star <= reviewRating ? styles.starInputFilled : styles.starInputUnfilled]}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.reviewLabel}>Comment</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Review fabric quality, sizing fit..."
                placeholderTextColor="#8E8E93"
                value={reviewComment}
                onChangeText={setReviewComment}
                multiline
              />

              <Text style={styles.reviewLabel}>Image URLs (Comma separated)</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="e.g. https://image.jpg"
                placeholderTextColor="#8E8E93"
                value={reviewImages}
                onChangeText={setReviewImages}
              />

              <TouchableOpacity style={styles.submitReviewBtn} onPress={handleReviewSubmit} disabled={submittingReview}>
                {submittingReview ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitReviewText}>POST REVIEW</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* List of Reviews */}
          <View style={styles.reviewsListBlock}>
            {reviews.length === 0 ? (
              <Text style={styles.noReviewsText}>No reviews yet. Be the first to write one!</Text>
            ) : (
              reviews.map((rev) => {
                const hasUpvoted = rev.helpfulUsers && user && rev.helpfulUsers.includes(user._id);
                return (
                  <View key={rev._id} style={styles.reviewCard}>
                    <View style={styles.reviewCardHeader}>
                      <Text style={styles.reviewUserName}>{rev.name}</Text>
                      <Text style={styles.reviewDate}>{new Date(rev.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.reviewHeaderRow}>
                      <View style={styles.reviewStarsRow}>
                        {[...Array(5)].map((_, i) => (
                          <Text key={i} style={[styles.starMiniIcon, i < rev.rating ? styles.starFilled : styles.starUnfilled]}>★</Text>
                        ))}
                      </View>
                      {rev.verifiedPurchase && (
                        <Text style={styles.verifiedBadge}>✓ VERIFIED</Text>
                      )}
                    </View>
                    <Text style={styles.reviewComment}>{rev.comment}</Text>
                    
                    {/* Review images */}
                    {rev.images && rev.images.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewImagesScroll}>
                        {rev.images.map((imgUrl, imgIdx) => (
                          <Image key={imgIdx} source={{ uri: imgUrl }} style={styles.reviewThumbnail} />
                        ))}
                      </ScrollView>
                    )}

                    {/* Helpful upvote button */}
                    <TouchableOpacity style={[styles.helpfulBtn, hasUpvoted && styles.helpfulBtnActive]} onPress={() => handleHelpfulClick(rev._id)}>
                      <Text style={[styles.helpfulBtnText, hasUpvoted && styles.helpfulBtnTextActive]}>
                        👍 Helpful ({rev.helpfulCount || 0})
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
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
    paddingBottom: 120
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
  colorSection: {
    paddingHorizontal: 20
  },
  colorsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10
  },
  colorCircle: {
    minWidth: 64,
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 12,
    marginRight: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  colorCircleSelected: {
    borderWidth: 2,
    borderColor: '#701122',
    backgroundColor: '#FAF7F2'
  },
  colorLabel: {
    fontSize: 11,
    color: '#554448',
    fontWeight: '600'
  },
  colorLabelSelected: {
    color: '#701122',
    fontWeight: 'bold'
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
    fontSize: 13,
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
  fabricDetailsBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5EFE6',
    paddingTop: 12
  },
  fabricCol: {
    flex: 1
  },
  fabricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase'
  },
  fabricVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2B1D20',
    marginTop: 2
  },
  specsSection: {
    paddingHorizontal: 20
  },
  specsBox: {
    marginTop: 10
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFE6'
  },
  specKey: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '300'
  },
  specValue: {
    fontSize: 12,
    color: '#2B1D20',
    fontWeight: '600'
  },
  policySection: {
    paddingHorizontal: 20
  },
  policyBox: {
    marginTop: 10
  },
  policyText: {
    fontSize: 12,
    color: '#554448',
    marginVertical: 4,
    lineHeight: 18
  },
  heritageCalloutBox: {
    paddingHorizontal: 20,
    marginTop: 16
  },
  heritageCallout: {
    backgroundColor: 'rgba(197, 160, 89, 0.08)',
    borderRadius: 16,
    padding: 16,
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
  reviewsSection: {
    paddingHorizontal: 20
  },
  ratingSummaryBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#F5EFE6',
    marginTop: 12
  },
  ratingSummaryLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F5EFE6'
  },
  avgRatingText: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'System',
    color: '#701122'
  },
  avgStarsRow: {
    flexDirection: 'row',
    marginVertical: 4
  },
  starReviewIcon: {
    fontSize: 12,
    marginHorizontal: 1
  },
  starFilled: {
    color: '#C5A059'
  },
  starUnfilled: {
    color: '#EBEBEB'
  },
  ratingsCountText: {
    fontSize: 9,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  ratingSummaryRight: {
    flex: 2,
    paddingLeft: 16,
    justifyContent: 'center'
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2
  },
  starLabelText: {
    fontSize: 10,
    color: '#6C757D',
    width: 24,
    textAlign: 'right'
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#F5EFE6',
    borderRadius: 2,
    marginHorizontal: 8,
    overflow: 'hidden'
  },
  progressBarFilled: {
    height: '100%',
    backgroundColor: '#C5A059'
  },
  percentText: {
    fontSize: 9,
    color: '#8E8E93',
    width: 28,
    textAlign: 'left'
  },
  writeReviewBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#F5EFE6',
    marginTop: 16
  },
  writeReviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#701122',
    marginBottom: 10
  },
  reviewLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6C757D',
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4
  },
  ratingInputRow: {
    flexDirection: 'row',
    marginVertical: 4
  },
  starInputIcon: {
    fontSize: 24,
    marginRight: 6
  },
  starInputFilled: {
    color: '#C5A059'
  },
  starInputUnfilled: {
    color: '#EBEBEB'
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#F5EFE6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#2B1D20',
    backgroundColor: '#FAF7F2',
    textAlignVertical: 'top',
    minHeight: 40
  },
  submitReviewBtn: {
    backgroundColor: '#701122',
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12
  },
  submitReviewText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  reviewsListBlock: {
    marginTop: 20
  },
  noReviewsText: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20
  },
  reviewCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFE6',
    paddingVertical: 14
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  reviewUserName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2B1D20'
  },
  reviewDate: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '300'
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  reviewStarsRow: {
    flexDirection: 'row'
  },
  starMiniIcon: {
    fontSize: 10,
    marginRight: 1
  },
  verifiedBadge: {
    fontSize: 8,
    fontWeight: '700',
    color: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8
  },
  reviewComment: {
    fontSize: 12,
    color: '#554448',
    lineHeight: 18,
    marginTop: 6,
    fontWeight: '300'
  },
  reviewImagesScroll: {
    flexDirection: 'row',
    marginTop: 8
  },
  reviewThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 8,
    resizeMode: 'cover',
    borderWidth: 0.5,
    borderColor: '#EBEBEB'
  },
  helpfulBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F5EFE6',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF'
  },
  helpfulBtnActive: {
    borderColor: '#701122',
    backgroundColor: 'rgba(112, 17, 34, 0.05)'
  },
  helpfulBtnText: {
    fontSize: 9,
    color: '#8E8E93',
    fontWeight: '700'
  },
  helpfulBtnTextActive: {
    color: '#701122'
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
