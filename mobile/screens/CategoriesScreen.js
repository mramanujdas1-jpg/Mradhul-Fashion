import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, Image, TouchableOpacity, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { useMobile } from '../context';

const { width } = Dimensions.get('window');

export default function CategoriesScreen({ route, navigation }) {
  const { API_HOST } = useMobile();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState('');

  // Read params if passed from Home
  useEffect(() => {
    if (route.params?.selectedCat) {
      setSelectedCategory(route.params.selectedCat);
    }
  }, [route.params?.selectedCat]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setNetworkError('');
        const catRes = await fetch(`${API_HOST}/categories`);
        if (catRes.ok) {
          const catData = await catRes.json();
          if (catData.length) {
            setCategories(catData);
            setSelectedCategory(prev => prev || catData[0].name);
          }
        }
        const prodRes = await fetch(`${API_HOST}/products`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          if (prodData.products && prodData.products.length) setProducts(prodData.products);
        }
      } catch (e) {
        setNetworkError('Unable to load live catalog categories. Please try again shortly.');
        setCategories([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.category.toLowerCase() === selectedCategory.toLowerCase() &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProductItem = ({ item }) => {
    const discountPercent = item.discountPrice
      ? Math.round(((item.price - item.discountPrice) / item.price) * 100)
      : 0;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
      >
        <Image source={{ uri: item.images[0].startsWith('http') ? item.images[0] : 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400' }} style={styles.productImage} />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.priceRow}>
            {item.discountPrice ? (
              <>
                <Text style={styles.discountPrice}>₹{item.discountPrice}</Text>
                <Text style={styles.originalPrice}>₹{item.price}</Text>
                <Text style={styles.offPercent}>{discountPercent}% OFF</Text>
              </>
            ) : (
              <Text style={styles.discountPrice}>₹{item.price}</Text>
            )}
          </View>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>★ {item.rating || 4.2}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <TextInput
          style={styles.searchInput}
          placeholder={`Search in ${selectedCategory}...`}
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.contentRow}>
        {/* Left Sidebar (Categories) */}
        <View style={styles.sidebar}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {categories.map((cat) => {
              const isSelected = cat.name.toLowerCase() === selectedCategory.toLowerCase();
              return (
                <TouchableOpacity
                  key={cat._id || cat.name}
                  style={[styles.sidebarTab, isSelected && styles.activeSidebarTab]}
                  onPress={() => {
                    setSelectedCategory(cat.name);
                    setSearchQuery('');
                  }}
                >
                  <Image
                    source={{ uri: cat.image.startsWith('http') ? cat.image : 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=100' }}
                    style={[styles.sidebarImage, isSelected && styles.activeSidebarImage]}
                  />
                  <Text style={[styles.sidebarText, isSelected && styles.activeSidebarText]} numberOfLines={2}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Right Pane (Products Grid) */}
        <View style={styles.productsPane}>
          {loading ? (
            <ActivityIndicator size="large" color="#701122" style={styles.loader} />
          ) : filteredProducts.length > 0 ? (
            <FlatList
              data={filteredProducts}
              renderItem={renderProductItem}
              keyExtractor={(item) => item._id}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <View style={styles.emptyView}>
              <Text style={styles.emptyText}>No items found in {selectedCategory}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2'
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FAF7F2'
  },
  searchInput: {
    height: 40,
    backgroundColor: '#F5EFE6',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#2B1D20',
    borderWidth: 0.5,
    borderColor: '#C5A059'
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row'
  },
  sidebar: {
    width: 95,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#F5EFE6'
  },
  sidebarTab: {
    paddingVertical: 16,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: 'transparent'
  },
  activeSidebarTab: {
    backgroundColor: '#FAF7F2',
    borderLeftColor: '#701122'
  },
  sidebarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F5EFE6'
  },
  activeSidebarImage: {
    borderColor: '#C5A059',
    borderWidth: 1.5
  },
  sidebarText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6C757D',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.2
  },
  activeSidebarText: {
    color: '#701122',
    fontWeight: 'bold'
  },
  productsPane: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 8
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  gridRow: {
    justifyContent: 'space-between'
  },
  listContainer: {
    paddingBottom: 24
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    width: (width - 125) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.12)',
    elevation: 2,
    shadowColor: '#701122',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover'
  },
  productInfo: {
    padding: 8
  },
  productName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2B1D20',
    height: 32
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    flexWrap: 'wrap'
  },
  discountPrice: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#701122'
  },
  originalPrice: {
    fontSize: 8,
    color: '#6C757D',
    textDecorationLine: 'line-through',
    marginLeft: 3
  },
  offPercent: {
    fontSize: 8,
    color: '#C5A059',
    fontWeight: '600',
    marginLeft: 3
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  ratingText: {
    fontSize: 8,
    color: '#FAF7F2',
    backgroundColor: '#C5A059',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    fontWeight: 'bold'
  },
  emptyView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center'
  }
});
