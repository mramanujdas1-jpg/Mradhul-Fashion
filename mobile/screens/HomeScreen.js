import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { useMobile } from '../context';

const { width } = Dimensions.get('window');

const fallbackCategories = [
  { _id: 'cat1', name: 'Handcrafted Sarees', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400' },
  { _id: 'cat2', name: 'Designer Lehengas', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400' },
  { _id: 'cat3', name: 'Royal Anarkalis', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400' },
  { _id: 'cat4', name: 'Jaipur Fusion Wear', image: 'https://images.unsplash.com/photo-1593030103066-0093718efeb9?w=400' },
  { _id: 'cat5', name: 'Bridal & Festive', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400' },
  { _id: 'cat6', name: 'Artisan Jackets & Dupattas', image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400' }
];

const fallbackProducts = [
  { _id: 'p1', name: 'Royale Jaipur Gota Patti Saree', price: 18999, discountPrice: 14999, category: 'Handcrafted Sarees', images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500'], sizes: ['Free Size'], rating: 4.9, isTrending: true },
  { _id: 'p2', name: 'Heritage Leheriya Silk Anarkali', price: 14499, discountPrice: 11999, category: 'Royal Anarkalis', images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500'], sizes: ['S', 'M', 'L', 'XL'], rating: 4.8, isTrending: true },
  { _id: 'p3', name: 'Shahi Zardozi Bridal Lehenga', price: 49999, discountPrice: 42999, category: 'Bridal & Festive', images: ['https://images.unsplash.com/photo-1593030103066-0093718efeb9?w=500'], sizes: ['S', 'M', 'L'], rating: 5.0, isTrending: true },
  { _id: 'p4', name: 'Sanganeri Print Palazzo Set', price: 8999, discountPrice: 6999, category: 'Jaipur Fusion Wear', images: ['https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500'], sizes: ['S', 'M', 'L', 'XL'], rating: 4.5, isFlashSale: true }
];

export default function HomeScreen({ navigation }) {
  const { API_HOST } = useMobile();
  const [categories, setCategories] = useState(fallbackCategories);
  const [products, setProducts] = useState(fallbackProducts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await fetch(`${API_HOST}/categories`);
        if (catRes.ok) {
          const catData = await catRes.json();
          if (catData.length) setCategories(catData);
        }
        const prodRes = await fetch(`${API_HOST}/products`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          if (prodData.products && prodData.products.length) setProducts(prodData.products);
        }
      } catch (e) {
        console.warn('Backend server offline. Rendering default mock collections on mobile.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const trendingItems = products.filter(p => p.isTrending);
  const flashSaleItems = products.filter(p => p.isFlashSale);

  const renderProductItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
      >
        <Image source={{ uri: item.images[0] }} style={styles.cardImage} />
        {item.isFlashSale && <View style={styles.flashBadge}><Text style={styles.badgeText}>FLASH SALE</Text></View>}
        <View style={styles.cardInfo}>
          <Text style={styles.cardCategory}>{item.category}</Text>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <View style={styles.priceRow}>
            {item.discountPrice ? (
              <>
                <Text style={styles.discountPrice}>₹{item.discountPrice}</Text>
                <Text style={styles.originalPrice}>₹{item.price}</Text>
              </>
            ) : (
              <Text style={styles.discountPrice}>₹{item.price}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Announcement bar */}
      <View style={styles.announcementBar}>
        <Text style={styles.announcementText}>🌸 MADE IN JAIPUR • HANDCRAFTED WITH LOVE 🌸</Text>
      </View>

      {/* 1. Brand Greeting Header */}
      <View style={styles.header}>
        <Text style={styles.greetingText}>MAJESTIC HERITAGE</Text>
        <Text style={styles.logoText}>Mradhul Fashion</Text>
        <Text style={styles.logoSubtext}>J A I P U R</Text>
      </View>

      {/* 2. Categories Horizontal Scroll */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shop Collections</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat._id || cat.name}
              style={styles.categoryBubble}
              onPress={() => navigation.navigate('Categories', { selectedCat: cat.name })}
            >
              <Image source={{ uri: cat.image.startsWith('http') ? cat.image : 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400' }} style={styles.categoryImage} />
              <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 3. Promotional banner */}
      <View style={styles.promoBanner}>
        <Image source={{ uri: 'https://images.unsplash.com/photo-1593030103066-0093718efeb9?w=800' }} style={styles.bannerImage} />
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerSubtitle}>THE MAHARANI BRIDAL</Text>
          <Text style={styles.bannerTitle}>Exquisite Zardozi</Text>
          <TouchableOpacity
            style={styles.bannerBtn}
            onPress={() => navigation.navigate('Categories', { selectedCat: 'Bridal & Festive' })}
          >
            <Text style={styles.bannerBtnText}>EXPLORE COUTURE</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Artisan Storytelling Section */}
      <View style={styles.storySection}>
        <View style={styles.storyCard}>
          <Text style={styles.storyHeader}>OUR ARTISAN LEGACY</Text>
          <Text style={styles.storyTitle}>Every Stitch Tells A Story</Text>
          <Text style={styles.storyText}>
            Hand-embellished Gota Patti ribbons, wooden block print fabrics of Sanganer, and pure mulberry silks. Every piece in our catalog is crafted by traditional local karigars of Rajasthan, keeping generational heritage alive.
          </Text>
          <View style={styles.divider} />
          <Text style={styles.storyFooter}>👑 MADE BY JAIPUR ARTISTS</Text>
        </View>
      </View>

      {/* 5. Flash clearance list */}
      {flashSaleItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Artisan Flash Sale</Text>
          <FlatList
            data={flashSaleItems}
            renderItem={renderProductItem}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listPadding}
          />
        </View>
      )}

      {/* 6. Trending grid list */}
      <View style={[styles.section, { marginBottom: 40 }]}>
        <Text style={styles.sectionTitle}>Trending Couture</Text>
        {loading ? (
          <ActivityIndicator color="#701122" size="large" style={{ marginVertical: 30 }} />
        ) : (
          <FlatList
            data={trendingItems}
            renderItem={renderProductItem}
            keyExtractor={(item) => item._id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.gridRow}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2'
  },
  announcementBar: {
    backgroundColor: '#701122',
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#C5A059'
  },
  announcementText: {
    color: '#FAF7F2',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 2
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center'
  },
  greetingText: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '600',
    color: '#C5A059',
    textTransform: 'uppercase',
    letterSpacing: 3
  },
  logoText: {
    fontFamily: 'System',
    fontSize: 26,
    fontWeight: 'bold',
    color: '#701122',
    marginTop: 4
  },
  logoSubtext: {
    fontSize: 9,
    fontWeight: '600',
    color: '#C5A059',
    letterSpacing: 6,
    marginTop: 2,
    textTransform: 'uppercase'
  },
  section: {
    marginTop: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2B1D20',
    paddingHorizontal: 20,
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  categoryScroll: {
    paddingHorizontal: 15
  },
  categoryBubble: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 80
  },
  categoryImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#C5A059',
    backgroundColor: '#FFFFFF'
  },
  categoryName: {
    fontSize: 9,
    fontWeight: '600',
    color: '#2B1D20',
    marginTop: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  promoBanner: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 24,
    overflow: 'hidden',
    height: 200,
    elevation: 4,
    shadowColor: '#701122',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 }
  },
  bannerImage: {
    width: '100%',
    height: '100%'
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(112, 17, 34, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  bannerSubtitle: {
    color: '#FAF7F2',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase'
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 14
  },
  bannerBtn: {
    backgroundColor: '#C5A059',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FAF7F2'
  },
  bannerBtnText: {
    color: '#FAF7F2',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5
  },
  storySection: {
    paddingHorizontal: 20,
    marginTop: 28
  },
  storyCard: {
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#C5A059',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center'
  },
  storyHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#C5A059',
    letterSpacing: 3
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#701122',
    marginTop: 6,
    marginBottom: 10
  },
  storyText: {
    fontSize: 12,
    color: '#554448',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '300'
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: '#C5A059',
    marginVertical: 12
  },
  storyFooter: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#701122',
    letterSpacing: 1
  },
  listPadding: {
    paddingHorizontal: 15
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: width * 0.43,
    marginHorizontal: 7,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.15)',
    elevation: 3,
    shadowColor: '#701122',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  cardImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover'
  },
  flashBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#701122',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#C5A059'
  },
  badgeText: {
    color: '#FAF7F2',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1
  },
  cardInfo: {
    padding: 12
  },
  cardCategory: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#C5A059',
    textTransform: 'uppercase'
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2B1D20',
    marginTop: 2
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4
  },
  discountPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#701122'
  },
  originalPrice: {
    fontSize: 10,
    color: '#6C757D',
    textDecorationLine: 'line-through',
    marginLeft: 6
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 15
  }
});
