import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

interface DashboardStats {
  products: {
    total: number;
    lowStock: number;
    outOfStock: number;
    inStock: number;
  };
  agents: {
    total: number;
    active: number;
    totalAssigned: number;
    totalSold: number;
    totalReturned: number;
  };
  sellers: {
    total: number;
    active: number;
    withServiceAreas: number;
  };
  sales: {
    today: {
      amount: number;
      orders: number;
    };
    monthly: {
      amount: number;
      orders: number;
    };
    yearly: {
      amount: number;
      orders: number;
    };
  };
  topSellingProducts: Array<{
    productId: string;
    name: string;
    totalSold: number;
    totalRevenue: number;
  }>;
  agentPerformance: Array<{
    agentId: string;
    name: string;
    totalAssigned: number;
    totalSold: number;
    salesPercentage: number;
  }>;
}

export default function DashboardScreen() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('https://api.ttsa.uz/api/shop-owner-mobile/statistics/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success && data.data) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardStats();
    }, [token])
  );

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('uz-UZ');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ma'lumotlar yuklanmoqda...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={fetchDashboardStats} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Umumiy statistikalar</Text>
      </View>

      {stats && (
        <>
          {/* Products Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mahsulotlar</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="cube-outline" size={24} color="#007AFF" />
                <Text style={styles.statValue}>{formatNumber(stats.products.total)}</Text>
                <Text style={styles.statLabel}>Jami mahsulotlar</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#34C759" />
                <Text style={styles.statValue}>{formatNumber(stats.products.inStock)}</Text>
                <Text style={styles.statLabel}>Mavjud</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="warning-outline" size={24} color="#FF9500" />
                <Text style={styles.statValue}>{formatNumber(stats.products.lowStock)}</Text>
                <Text style={styles.statLabel}>Kam zaxira</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="close-circle-outline" size={24} color="#FF3B30" />
                <Text style={styles.statValue}>{formatNumber(stats.products.outOfStock)}</Text>
                <Text style={styles.statLabel}>Tugagan</Text>
              </View>
            </View>
          </View>

          {/* Sellers Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sotuvchilar</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="people-outline" size={24} color="#007AFF" />
                <Text style={styles.statValue}>{formatNumber(stats.sellers.total)}</Text>
                <Text style={styles.statLabel}>Jami sotuvchilar</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#34C759" />
                <Text style={styles.statValue}>{formatNumber(stats.sellers.active)}</Text>
                <Text style={styles.statLabel}>Faol</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="location-outline" size={24} color="#FF9500" />
                <Text style={styles.statValue}>{formatNumber(stats.sellers.withServiceAreas)}</Text>
                <Text style={styles.statLabel}>Xizmat hududlari bilan</Text>
              </View>
            </View>
          </View>

          {/* Sales Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sotuvlar</Text>
            <View style={styles.salesContainer}>
              <View style={styles.salesCard}>
                <Text style={styles.salesPeriod}>Bugun</Text>
                <Text style={styles.salesAmount}>{formatCurrency(stats.sales.today.amount)}</Text>
                <Text style={styles.salesOrders}>{stats.sales.today.orders} ta buyurtma</Text>
              </View>
              <View style={styles.salesCard}>
                <Text style={styles.salesPeriod}>Oylik</Text>
                <Text style={styles.salesAmount}>{formatCurrency(stats.sales.monthly.amount)}</Text>
                <Text style={styles.salesOrders}>{stats.sales.monthly.orders} ta buyurtma</Text>
              </View>
              <View style={styles.salesCard}>
                <Text style={styles.salesPeriod}>Yillik</Text>
                <Text style={styles.salesAmount}>{formatCurrency(stats.sales.yearly.amount)}</Text>
                <Text style={styles.salesOrders}>{stats.sales.yearly.orders} ta buyurtma</Text>
              </View>
            </View>
          </View>

          {/* Top Selling Products */}
          {stats.topSellingProducts && Array.isArray(stats.topSellingProducts) && stats.topSellingProducts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Eng ko'p sotilgan mahsulotlar</Text>
              <View style={styles.listContainer}>
                {stats.topSellingProducts.map((product, index) => (
                  <View key={product.productId} style={styles.listItem}>
                    <View style={styles.listItemLeft}>
                      <Text style={styles.listItemRank}>#{index + 1}</Text>
                      <Text style={styles.listItemName}>{product.name}</Text>
                    </View>
                    <View style={styles.listItemRight}>
                      <Text style={styles.listItemValue}>{formatNumber(product.totalSold)}</Text>
                      <Text style={styles.listItemRevenue}>{formatCurrency(product.totalRevenue)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Agent Performance */}
          {stats.agentPerformance && Array.isArray(stats.agentPerformance) && stats.agentPerformance.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Agent ishlashi</Text>
              <View style={styles.listContainer}>
                {stats.agentPerformance.map((agent, index) => (
                  <View key={agent.agentId} style={styles.listItem}>
                    <View style={styles.listItemLeft}>
                      <Text style={styles.listItemRank}>#{index + 1}</Text>
                      <Text style={styles.listItemName}>{agent.name}</Text>
                    </View>
                    <View style={styles.listItemRight}>
                      <Text style={styles.listItemValue}>{formatNumber(agent.totalSold)}/{formatNumber(agent.totalAssigned)}</Text>
                      <Text style={styles.listItemPercentage}>{agent.salesPercentage}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  salesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  salesCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  salesPeriod: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  salesAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  salesOrders: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  listContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listItemRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 12,
    width: 24,
  },
  listItemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  listItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  listItemRevenue: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  listItemPercentage: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 2,
  },
});
