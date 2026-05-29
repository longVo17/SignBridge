import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme/theme';
import { Sign } from '../types/data.types';
import { useSignsList, useSignSearch, useCategories } from '../hooks/useDictionary';
import VideoModal from '../components/ui/VideoModal';

const { width } = Dimensions.get('window');
const CARD_W = (width - SPACING.sm * 2 - 12) / 2;

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'All':       'sparkles-outline',
  'Greetings': 'hand-left-outline',
  'Basics':    'chatbubble-outline',
  'Daily':     'sunny-outline',
  'Family':    'people-outline',
  'Numbers':   'grid-outline',
  'Colors':    'color-palette-outline',
};

export const DictionaryScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedSign, setSelectedSign] = useState<Sign | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // 1. Fetch all signs once (using useSignsList(undefined))
  const { signs, loading, error, reload } = useSignsList(undefined);

  // 2. Extract unique categories client-side from loaded signs
  const categories = useMemo(() => {
    const list = signs.map((s) => s.category);
    return [...new Set(list)].sort();
  }, [signs]);

  // 3. Filter signs by selectedCategory and query client-side
  const displayedSigns = useMemo(() => {
    let filtered = [...signs];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(
        (s) => s.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search query
    if (query.trim()) {
      const lower = query.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(lower) ||
          s.category.toLowerCase().includes(lower) ||
          s.keywords?.some((k) => k.toLowerCase().includes(lower)) ||
          s.description?.toLowerCase().includes(lower)
      );
    }

    // Sort alphabetically by title
    return filtered.sort((a, b) => a.title.localeCompare(b.title));
  }, [signs, selectedCategory, query]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const openModal = (sign: Sign) => {
    setSelectedSign(sign);
    setModalVisible(true);
  };

  // ── Render header + search + category filter ───────────────────
  const renderHeader = () => (
    <>
      {/* Page Header */}
      <LinearGradient
        colors={['rgba(45,199,255,0.12)', 'transparent']}
        style={styles.pageHeader}
      >
        <Text style={styles.pageTitle}>ASL Dictionary</Text>
        <Text style={styles.pageSubtitle}>
          {query.trim()
            ? `${displayedSigns.length} result${displayedSigns.length !== 1 ? 's' : ''} for "${query}"`
            : `${displayedSigns.length} ASL sign${displayedSigns.length !== 1 ? 's' : ''}`}
        </Text>

        {/* Search Bar */}
        <BlurView 
          intensity={85} 
          tint="light" 
          style={[
            styles.searchBar,
            isSearchFocused && styles.searchBarFocused
          ]}
        >
          <Ionicons 
            name="search-outline" 
            size={18} 
            color={isSearchFocused ? '#2DC7FF' : COLORS.textSecondary} 
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search dictionary..."
            placeholderTextColor={COLORS.textSecondary}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </BlurView>
      </LinearGradient>

      {/* Category Filter */}
      <FlatList
        horizontal
        data={['All', ...categories]}
        keyExtractor={item => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => {
          const active = (item === 'All' && !selectedCategory) || item === selectedCategory;
          return (
            <TouchableOpacity
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(item === 'All' ? undefined : item)}
            >
              <Ionicons 
                name={CATEGORY_ICONS[item] ?? 'bookmark-outline'} 
                size={14} 
                color={active ? '#FFF' : '#2DC7FF'} 
              />
              <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </>
  );

  // ── Sign Card ──────────────────────────────────────────────────
  const renderSignCard = ({ item, index }: { item: Sign; index: number }) => (
    <Animatable.View animation="fadeInUp" delay={index * 40} useNativeDriver>
      <TouchableOpacity style={styles.card} onPress={() => openModal(item)} activeOpacity={0.75}>
        {/* Thumbnail or Icon placeholder */}
        <View style={styles.thumbWrap}>
          {item.thumbnailURL ? (
            <Image source={{ uri: item.thumbnailURL }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <Ionicons name="videocam-outline" size={40} color="#2DC7FF" />
          )}
          {/* Play overlay */}
          <View style={styles.playOverlay}>
            <Ionicons name="play-circle" size={36} color="rgba(255,255,255,0.9)" />
          </View>
          {/* Difficulty badge */}
          <View style={[styles.badge, { backgroundColor: getDiffColor(item.difficulty) }]}>
            <Text style={styles.badgeText}>{item.difficulty}</Text>
          </View>
        </View>

        {/* Card content */}
        <View style={styles.cardContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardCategory}>{item.category}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  // ── Empty / Error States ───────────────────────────────────────
  const ListEmpty = () => (
    <View style={styles.emptyWrap}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.emptyText}>Loading dictionary...</Text>
        </>
      ) : error ? (
        <>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={reload}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </>
      ) : query.trim() ? (
        <>
          <Ionicons name="search-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No results found for "{query}"</Text>
        </>
      ) : (
        <>
          <Ionicons name="folder-open-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No signs in database. Please seed Firestore!</Text>
        </>
      )}
    </View>
  );

  return (
    <LinearGradient colors={['#E8F8FF', '#F0FBFF', '#FAFEFF']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          data={displayedSigns}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={renderSignCard}
          ListHeaderComponent={renderHeader()}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      </SafeAreaView>

      <VideoModal
        sign={selectedSign}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </LinearGradient>
  );
};

// ── Helpers ────────────────────────────────────────────────────────
function getDiffColor(d: string) {
  switch (d) {
    case 'Easy': return '#22C55E';
    case 'Medium': return '#F59E0B';
    case 'Hard': return '#EF4444';
    default: return COLORS.textSecondary;
  }
}

// ── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 100 },

  // Header
  pageHeader: {
    padding: SPACING.sm,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  pageTitle: {
    ...TYPOGRAPHY.headlineMedium,
    color: COLORS.text,
    marginBottom: 4,
  },
  pageSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 100, // Make it a gorgeous pill shape
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(45,199,255,0.15)',
    ...SHADOWS.soft,
  },
  searchBarFocused: {
    borderColor: '#2DC7FF',
    backgroundColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#2DC7FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    padding: 0,
  },

  // Category chips
  categoryList: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryEmoji: { fontSize: 14 },
  categoryLabel: {
    ...TYPOGRAPHY.labelMedium,
    color: COLORS.textSecondary,
  },
  categoryLabelActive: { color: '#FFF' },

  // Grid
  row: {
    paddingHorizontal: SPACING.sm,
    gap: 12,
    marginBottom: 12,
  },

  // Card
  card: {
    width: CARD_W,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    ...SHADOWS.soft,
  },
  thumbWrap: {
    width: '100%',
    height: CARD_W * 0.6,
    backgroundColor: COLORS.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbEmoji: { fontSize: 40 },
  playOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    ...TYPOGRAPHY.labelSmall,
    color: '#FFF',
    fontSize: 9,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  cardEmoji: { fontSize: 20 },
  cardTitle: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.text,
    fontSize: 13,
  },
  cardCategory: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.textSecondary,
    marginTop: 1,
  },

  // Empty/Error
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: { fontSize: 48 },
  emptyText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: {
    ...TYPOGRAPHY.labelLarge,
    color: '#FFF',
  },
});
