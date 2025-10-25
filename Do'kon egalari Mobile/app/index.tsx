import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { API_ENDPOINTS } from './api';

declare module '@react-navigation/native' {
  export function useNavigation<S = any>(): S;
}

// Helper function to handle MongoDB Decimal128 values
const getDecimalValue = (value: any): number => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (value.$numberDecimal) return parseFloat(value.$numberDecimal);
  return parseFloat(value);
};

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

interface QuickAction {
  title: string;
  icon: any;
  color: string;
  onPress: () => void;
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<any>(null); // Temporarily using any type to match the new API response
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const auth = useAuth();
  const { token, logout } = auth || { token: null, logout: async () => { /* no-op */ } };
  const fetchDashboardStatsRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const fetchDashboardStats = useCallback(async (isRefreshing = false) => {
    if (!token) {
      console.log('No token found, redirecting to login...');
      // You might want to redirect to login here
      return;
    }

    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      console.log('Fetching dashboard stats...');
      const response = await fetch(API_ENDPOINTS.STATISTICS.DASHBOARD, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });
      
      const responseData = await response.json();
      console.log('=== DASHBOARD API RESPONSE ===');
      console.log(JSON.stringify(responseData, null, 2));
      console.log('=== END OF RESPONSE ===');
      
      if (response.status === 401) {
        // Token is invalid or expired
        console.log('Authentication failed - invalid token, logging out...');
        await logout();
        return;
      }
      
      if (responseData.success === false && (responseData.message === "Do'kon topilmadi" || responseData.message === "Do'kon topilmadi yoki faol emas")) {
        // Store not found - don't logout, just show message
        console.log('Store not found or inactive:', responseData.message);
        console.log('User will be redirected to store setup or shown appropriate message');
        // Don't logout here - let user know they need to set up their store
        setStats(null);
        return;
      }
      
      if (!response.ok || !responseData.success) {
        console.error('Failed to fetch dashboard stats:', responseData);
        // Don't throw error, just show empty state
        setStats(null);
        return;
      }
      
      setStats(responseData.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardStatsRef.current = fetchDashboardStats;
  }, [fetchDashboardStats]);

  const onRefresh = useCallback(async () => {
    console.log('Pull to refresh triggered');
    await fetchDashboardStats(true);
  }, [fetchDashboardStats]);
  
  // Fetch data on screen focus and when token changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Dashboard screen focused, refreshing data...');
      fetchDashboardStats(true);
    });

    // Initial fetch
    fetchDashboardStats(false);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [navigation, fetchDashboardStats, token]); // Add token to dependency array

  // Format currency helper
  const formatCurrency = (amount: any) => {
    const value = typeof amount === 'number' ? amount : getDecimalValue(amount);
    return value.toLocaleString('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Format decimal helper
  const formatDecimal = (value: any) => {
    const num = getDecimalValue(value);
    return new Intl.NumberFormat('uz-UZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  // Quick actions removed as per request

  interface StatCardProps { 
    title: string; 
    value: string | number; 
    subtitle?: string | React.ReactNode;
    icon: any; 
    color: string;
    compact?: boolean;
    footer?: React.ReactNode;
  }

  const StatCard = ({ title, value, subtitle, icon, color, compact, footer }: StatCardProps) => (
    <View style={[
      styles.statCard, 
      compact ? styles.compactCard : {},
      { borderLeftColor: color }
    ]}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={compact ? 20 : 24} color={color} />
      </View>
      <View style={[styles.statContent, compact ? styles.compactContent : {}]}>
        <Text style={[
          styles.statValue, 
          compact ? styles.compactValue : {},
          { color: compact ? color : '#000' }
        ]}>
          {value}
        </Text>
        <Text style={[
          styles.statTitle,
          compact ? styles.compactTitle : {}
        ]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[
            styles.statSubtitle,
            compact ? styles.compactSubtitle : {}
          ]}>
            {subtitle}
          </Text>
        )}
        {footer && (
          <View style={styles.cardFooter}>
            {footer}
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="storefront-outline" size={48} color="#FF9500" />
        <Text style={styles.errorTitle}>Do'kon topilmadi</Text>
        <Text style={styles.errorText}>
          Sizning do'koningiz hali yaratilmagan yoki faol emas.{'\n'}
          Iltimos, administrator bilan bog'laning yoki qaytadan urinib ko'ring.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchDashboardStats(false)}>
          <Text style={styles.retryButtonText}>Qaytadan urinish</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: '#007AFF', marginTop: 10 }]} onPress={() => {
          // You can add navigation to contact admin or store setup here
          console.log('Contact admin or setup store');
        }}>
          <Text style={styles.retryButtonText}>Administrator bilan bog'lanish</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Format sales data for display
  const formatSalesData = (sales: any) => {
    return {
      today: formatCurrency(sales?.today?.amount || 0),
      todayOrders: sales?.today?.orders || 0,
      monthly: formatCurrency(sales?.monthly?.amount || 0),
      monthlyOrders: sales?.monthly?.orders || 0,
      yearly: formatCurrency(sales?.yearly?.amount || 0),
      yearlyOrders: sales?.yearly?.orders || 0
    };
  };

  const salesData = stats?.sales ? formatSalesData(stats.sales) : null;
  const products = stats?.products || {};
  const agents = stats?.agents || {};
  const agentPerformance = stats?.agentPerformance || [];

  return (
    <View style={styles.container}>
      <ProtectedRoute>
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
        >
          {/* Header with Date */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Boshqaruv paneli</Text>
            <Text style={styles.headerDate}>
              {new Date().toLocaleDateString('uz-UZ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </Text>
          </View>

          {/* Products Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mahsulotlar</Text>
            <View style={styles.statsGrid}>
              <StatCard 
                title="Jami mahsulotlar" 
                value={products.total || 0} 
                icon="cube-outline" 
                color="#007AFF"
              />
              <StatCard 
                title="Sotuvda" 
                value={products.inStock || 0} 
                icon="checkmark-circle-outline" 
                color="#34C759"
              />
              <StatCard 
                title="Qolgani oz" 
                value={products.lowStock || 0} 
                icon="warning-outline" 
                color="#FF9500"
              />
              <StatCard 
                title="Tugagan" 
                value={products.outOfStock || 0} 
                icon="close-circle-outline" 
                color="#FF3B30"
              />
            </View>
          </View>

          {/* Agents Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agentlar</Text>
            <View style={styles.statsGrid}>
              <StatCard 
                title="Jami agentlar" 
                value={agents.total || 0} 
                icon="people-outline" 
                color="#5856D6"
              />
              <StatCard 
                title="Faol agentlar" 
                value={agents.active || 0} 
                icon="person-check-outline" 
                color="#34C759"
              />
              <StatCard 
                title={`Yuklangan (${agents.totalAssigned || 0})`} 
                value={`Sotilgan: ${agents.totalSold || 0}`} 
                icon="cube-outline" 
                color="#007AFF"
                compact
              />
              <StatCard 
                title="Qaytarilgan" 
                value={agents.totalReturned || 0} 
                icon="return-up-back-outline" 
                color="#FF9500"
              />
            </View>
          </View>

          {/* Sales Summary
          {salesData && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sotuvlar</Text>
              <View style={styles.statsGrid}>
                <StatCard 
                  title="Bugungi" 
                  value={salesData.today} 
                  subtitle={`${salesData.todayOrders} ta buyurtma`}
                  icon="today-outline" 
                  color="#34C759"
                />
                <StatCard 
                  title="Oylik" 
                  value={salesData.monthly} 
                  subtitle={`${salesData.monthlyOrders} ta buyurtma`}
                  icon="calendar-outline" 
                  color="#007AFF"
                />
                <StatCard 
                  title="Yillik" 
                  value={salesData.yearly} 
                  subtitle={`${salesData.yearlyOrders} ta buyurtma`}
                  icon="calendar-number-outline" 
                  color="#5856D6"
                />
              </View>
            </View>
          )} */}

          {/* Agent Performance */}
          {agentPerformance.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Agentlar natijalari</Text>
              <View style={styles.agentPerformanceContainer}>
                {agentPerformance.map((agent: any, index: number) => (
                  <View key={agent.agentId || index} style={styles.agentCard}>
                    <View style={styles.agentHeader}>
                      <Ionicons name="person-circle-outline" size={24} color="#007AFF" />
                      <Text style={styles.agentName}>
                        {agent.name || `Agent ${index + 1}`}
                      </Text>
                    </View>
                    <View style={styles.agentStats}>
                      <View style={styles.agentStat}>
                        <Text style={styles.agentStatLabel}>Yuklangan:</Text>
                        <Text style={styles.agentStatValue}>{agent.totalAssigned || 0}</Text>
                      </View>
                      <View style={styles.agentStat}>
                        <Text style={styles.agentStatLabel}>Sotilgan:</Text>
                        <Text style={[styles.agentStatValue, {color: '#34C759'}]}>
                          {agent.totalSold || 0}
                        </Text>
                      </View>
                      <View style={styles.agentStat}>
                        <Text style={styles.agentStatLabel}>Foiz:</Text>
                        <Text style={styles.agentStatValue}>
                          {agent.salesPercentage || 0}%
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </ProtectedRoute>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    paddingBottom: 20,
  },
  // Agent Performance Styles
  agentPerformanceContainer: {
    marginTop: 10,
  },
  agentCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  agentName: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  agentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  agentStat: {
    alignItems: 'center',
    flex: 1,
  },
  agentStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  agentStatValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 6,
    fontFamily: 'System',
  },
  headerDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  quickActionIcon: {
    marginRight: 10,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 12,
    marginBottom: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    marginTop: 4,
    fontFamily: 'System',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -5,
  },

  primaryCard: {
    backgroundColor: '#007AFF',
  },
  warningCard: {
    backgroundColor: '#FF9500',
  },

  statLabel: {
    fontSize: 13,
    color: '#636366',
    marginBottom: 4,
    fontFamily: 'System',
    fontWeight: '500',
  },
  statIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    opacity: 0.15,
    transform: [{ scale: 1.8 }],
  },
  // Stat Card Styles
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 5,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    width: '95%',
    marginBottom: 12,
    minHeight: 120,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  } as any,
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 6,
    fontFamily: 'System',
  } as any,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  } as any,
  profitSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  } as any,
  profitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#000',
    flex: 1,
  },
  profitPercent: {
    marginLeft: 'auto',
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9500',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontFamily: 'System',
  },
  profitDetails: {
    marginTop: 8,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  profitLabel: {
    fontSize: 15,
    color: '#636366',
    fontFamily: 'System',
    fontWeight: '500',
  },
  profitValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    fontFamily: 'System',
  },
  paymentMethods: {
    marginTop: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  paymentMethod: {
    flex: 1,
    alignItems: 'center',
  },
  paymentDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: -8,
  },
  paymentLabel: {
    fontSize: 13,
    color: '#636366',
    marginTop: 8,
    fontWeight: '500',
    fontFamily: 'System',
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 2,
    marginBottom: 2,
    fontFamily: 'System',
  } as any,
  quickStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  paymentCount: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
    fontFamily: 'System',
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  halfCard: {
    width: '48%',
  },
  compactCard: {
    padding: 12,
  },
  compactContent: {
    marginLeft: 12,
  },
  compactValue: {
    fontSize: 18,
    marginBottom: 2,
  },
  compactTitle: {
    fontSize: 12,
  },
  compactSubtitle: {
    fontSize: 11,
  },
  cardFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  profitDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  profitDetailLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  profitDetailValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
  },

  statsContainer: {
    padding: 16,
  },

  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },

  statTitle: {
    fontSize: 14,
    color: '#666',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },

  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    paddingBottom: 24,
  },
  quickActionCard: {
    width: '44%',
    aspectRatio: 1,
    margin: '3%',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickActionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },

  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
