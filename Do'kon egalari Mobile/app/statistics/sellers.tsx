import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../context/AuthContext';

interface Seller {
    id: string;
    fullName: string;
    username: string;
    phone: string;
    status: 'active' | 'inactive';
    assignedAt: string;
    serviceAreasCount: number;
    totalRegions: number;
    totalDistricts: number;
    totalMfys: number;
    serviceAreas: ServiceArea[];
}

interface ServiceArea {
    region: string;
    districts: string[];
    mfys: string[];
}

interface SellersStats {
    summary: {
        totalSellers: number;
        sellersWithServiceAreas: number;
        sellersWithoutServiceAreas: number;
        coveragePercentage: number;
    };
    topRegions: Array<{
        name: string;
        count: number;
    }>;
    topDistricts: Array<{
        name: string;
        count: number;
    }>;
    topMfys: Array<{
        name: string;
        count: number;
    }>;
    sellers: Seller[];
}

interface Product {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    totalAmount: number;
    lastSold: string;
}

interface OrderProduct {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    unit: string;
    unitSize: number;
    _id: string;
}

interface Order {
    orderId: number;
    totalSum: number;
    products: OrderProduct[];
    createdAt: string;
    status: 'completed' | 'cancelled';
    paymentMethod: 'cash' | 'card';
}

interface SellerStats {
    sellerId: string;
    name: string;
    username: string;
    totalOrders: number;
    totalAmount: number;
    totalProducts: number;
    averageOrderAmount: number;
    firstOrderDate: string;
    lastOrderDate: string;
    topProducts: Product[];
    allProducts: Product[];
    orders: Order[];
}

interface OverallStats {
    totalOrders: number;
    totalAmount: number;
    averageOrderAmount: number;
    minOrderAmount: number;
    maxOrderAmount: number;
    firstOrderDate: string;
    lastOrderDate: string;
}

interface DateRange {
    startDate: string;
    endDate: string;
}

interface ApiResponse {
    success: boolean;
    data: {
        sellers: SellerStats[];
        overall: OverallStats;
        dateRange: DateRange | null;
    };
}

export default function SellersStatisticsScreen() {
    const { token } = useAuth();
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
    const [showSellerPicker, setShowSellerPicker] = useState(false);
    const [stats, setStats] = useState<SellersStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateType, setDateType] = useState<'start' | 'end'>('start');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date(),
    });

    const fetchSellers = async () => {
        try {
      const response = await fetch('https://api.ttsa.uz/api/shop-owner-mobile/statistics/sellers', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.success && data.data) {
                setSellers(data.data.sellers || []);
                setStats(data.data);
                
                // If no seller is selected, select the first one
                if (data.data.sellers && data.data.sellers.length > 0 && !selectedSeller) {
                    setSelectedSeller(data.data.sellers[0]);
                }
                
                // Set the stats with the full data
                setStats(data.data);
            }
        } catch (error) {
            console.error('Error fetching sellers:', error);
        }
    };

    const fetchStats = async () => {
        try {
            setLoading(true);
            const startDateStr = dateRange.startDate.toISOString().split('T')[0];
            const endDateStr = dateRange.endDate.toISOString().split('T')[0];
            
            // First fetch the sellers list if not already loaded
            if (!sellers || sellers.length === 0) {
                await fetchSellers();
            }
            
            const response = await fetch(
                `https://api.ttsa.uz/api/statistics/sellers`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                setStats(result.data);
            } else {
                console.error('API Error:', result.message || 'Unknown error');
                setStats(null);
            }
        } catch (error) {
            console.error('Error fetching seller stats:', error);
            // Set some default data for testing
            setStats({
                summary: {
                    totalSellers: 0,
                    sellersWithServiceAreas: 0,
                    sellersWithoutServiceAreas: 0,
                    coveragePercentage: 0
                },
                topRegions: [],
                topDistricts: [],
                topMfys: [],
                sellers: []
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSellers();
    }, []);

    // No need for separate fetchStats effect since we get all data in fetchSellers

    const formatNumber = (num: number | undefined | null) => {
        if (num === undefined || num === null) return '0';
        return num.toLocaleString('uz-UZ');
    };

    const formatCurrency = (amount: number | undefined | null) => {
        if (amount === undefined || amount === null) return '0 UZS';
        return amount.toLocaleString('uz-UZ', {
            style: 'currency',
            currency: 'UZS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('uz-UZ');
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDateRange(prev => ({
                ...prev,
                [dateType === 'start' ? 'startDate' : 'endDate']: selectedDate,
            }));
        }
    };

    const getSellerStats = () => {
        if (!stats?.sellers || !selectedSeller) return null;
        // Find the seller by sellerId
        const sellerData = stats.sellers.find(s => s.id === selectedSeller.id);
        if (!sellerData) return null;
        
        // Return seller data with service areas info
        return {
            ...sellerData,
            serviceAreasCount: sellerData.serviceAreasCount || 0,
            totalRegions: sellerData.totalRegions || 0,
            totalDistricts: sellerData.totalDistricts || 0,
            totalMfys: sellerData.totalMfys || 0
        };
    };

    const safeFormatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('uz-UZ');
        } catch (e) {
            return 'N/A';
        }
    };

    const sellerStats = getSellerStats();
    const summaryStats = stats?.summary || {
        totalSellers: 0,
        sellersWithServiceAreas: 0,
        sellersWithoutServiceAreas: 0,
        coveragePercentage: 0
    };

    return (
        <View style={styles.container}>
            {/* Seller Selector */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.selectorButton}
                    onPress={() => setShowSellerPicker(true)}
                >
                    <Text style={styles.selectorButtonText}>
                        {selectedSeller ? selectedSeller.fullName : "Sotuvchini tanlang"}
                    </Text>
                    <Ionicons name="chevron-down" size={24} color="#2D1B69" />
                </TouchableOpacity>
            </View>

            {/* Seller Picker Modal */}
            <Modal
                visible={showSellerPicker}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Sotuvchini tanlang</Text>
                            <TouchableOpacity
                                onPress={() => setShowSellerPicker(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.sellersList}>
                            {sellers.map((seller) => (
                                <TouchableOpacity
                                    key={seller.id}
                                    style={[
                                        styles.sellerOption,
                                        selectedSeller?.id === seller.id && styles.selectedOption
                                    ]}
                                    onPress={() => {
                                        setSelectedSeller(seller);
                                        setShowSellerPicker(false);
                                        setLoading(true);
                                        fetchStats();
                                    }}
                                >
                                    <View>
                                        <Text style={[
                                            styles.sellerOptionName,
                                            selectedSeller?.id === seller.id && styles.selectedOptionText
                                        ]}>
                                            {seller.fullName}
                                        </Text>
                                        <Text style={[
                                            styles.sellerOptionUsername,
                                            selectedSeller?.id === seller.id && styles.selectedOptionText
                                        ]}>
                                            @{seller.username}
                                        </Text>
                                    </View>
                                    {seller.status === 'active' ? (
                                        <Text style={styles.activeStatus}>Faol</Text>
                                    ) : (
                                        <Text style={styles.inactiveStatus}>Nofaol</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Date Range Selector */}
            <View style={styles.dateRangeContainer}>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                        setDateType('start');
                        setShowDatePicker(true);
                    }}
                >
                    <Text style={styles.dateButtonText}>
                        Boshlanish: {dateRange.startDate.toLocaleDateString('uz-UZ')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                        setDateType('end');
                        setShowDatePicker(true);
                    }}
                >
                    <Text style={styles.dateButtonText}>
                        Tugash: {dateRange.endDate.toLocaleDateString('uz-UZ')}
                    </Text>
                </TouchableOpacity>
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={dateType === 'start' ? dateRange.startDate : dateRange.endDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}

            {/* Stats Content */}
            <ScrollView
                style={styles.statsContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2D1B69']} />
                }
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2D1B69" />
                    </View>
                ) : !selectedSeller ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="person" size={48} color="#666" />
                        <Text style={styles.emptyText}>Sotuvchini tanlang</Text>
                    </View>
                ) : !sellerStats ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
                        <Text style={styles.emptyText}>Ma'lumot topilmadi</Text>
                    </View>
                ) : (
                    <>
                        {/* Summary Stats */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Umumiy statistika</Text>
                            <View style={styles.overviewContainer}>
                                <View style={[styles.card, styles.overviewCard]}>
                                    <Ionicons name="people-outline" size={32} color="#2D1B69" />
                                    <Text style={styles.cardValue}>{formatNumber(stats?.summary.totalSellers || 0)}</Text>
                                    <Text style={styles.cardLabel}>Jami sotuvchilar</Text>
                                </View>
                                <View style={[styles.card, styles.overviewCard]}>
                                    <Ionicons name="location-outline" size={32} color="#2D1B69" />
                                    <Text style={styles.cardValue}>{formatNumber(stats?.summary.sellersWithServiceAreas || 0)}</Text>
                                    <Text style={styles.cardLabel}>Xizmat hududlari bilan</Text>
                                </View>
                                <View style={[styles.card, styles.overviewCard]}>
                                    <Ionicons name="trending-up-outline" size={32} color="#2D1B69" />
                                    <Text style={styles.cardValue}>{formatNumber(stats?.summary.coveragePercentage || 0)}%</Text>
                                    <Text style={styles.cardLabel}>Qamrov foizi</Text>
                                </View>
                            </View>
                        </View>

                        {/* Top Regions */}
                        {stats?.topRegions && Array.isArray(stats.topRegions) && stats.topRegions.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Eng ko'p ishlatilgan viloyatlar</Text>
                                <View style={styles.listContainer}>
                                    {stats.topRegions.map((region, index) => (
                                        <View key={index} style={styles.listItem}>
                                            <Text style={styles.listItemName}>{region.name}</Text>
                                            <Text style={styles.listItemValue}>{region.count} ta</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Top Districts */}
                        {stats?.topDistricts && Array.isArray(stats.topDistricts) && stats.topDistricts.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Eng ko'p ishlatilgan tumanlar</Text>
                                <View style={styles.listContainer}>
                                    {stats.topDistricts.map((district, index) => (
                                        <View key={index} style={styles.listItem}>
                                            <Text style={styles.listItemName}>{district.name}</Text>
                                            <Text style={styles.listItemValue}>{district.count} ta</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Top MFYs */}
                        {stats?.topMfys && Array.isArray(stats.topMfys) && stats.topMfys.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Eng ko'p ishlatilgan MFYlar</Text>
                                <View style={styles.listContainer}>
                                    {stats.topMfys.map((mfy, index) => (
                                        <View key={index} style={styles.listItem}>
                                            <Text style={styles.listItemName}>{mfy.name}</Text>
                                            <Text style={styles.listItemValue}>{mfy.count} ta</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Selected Seller Details */}
                        {selectedSeller && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>
                                    {selectedSeller.fullName} tafsilotlari
                                    <Text style={styles.sectionSubtitle}> @{selectedSeller.username}</Text>
                                </Text>
                                <View style={styles.overviewContainer}>
                                    <View style={[styles.card, styles.overviewCard]}>
                                        <Ionicons name="location-outline" size={32} color="#2D1B69" />
                                        <Text style={styles.cardValue}>{formatNumber(selectedSeller.serviceAreasCount)}</Text>
                                        <Text style={styles.cardLabel}>Xizmat hududlari</Text>
                                    </View>
                                    <View style={[styles.card, styles.overviewCard]}>
                                        <Ionicons name="map-outline" size={32} color="#2D1B69" />
                                        <Text style={styles.cardValue}>{formatNumber(selectedSeller.totalRegions)}</Text>
                                        <Text style={styles.cardLabel}>Viloyatlar</Text>
                                    </View>
                                </View>
                                <View style={styles.overviewContainer}>
                                    <View style={[styles.card, styles.overviewCard]}>
                                        <Ionicons name="business-outline" size={32} color="#2D1B69" />
                                        <Text style={styles.cardValue}>{formatNumber(selectedSeller.totalDistricts)}</Text>
                                        <Text style={styles.cardLabel}>Tumanlar</Text>
                                    </View>
                                    <View style={[styles.card, styles.overviewCard]}>
                                        <Ionicons name="home-outline" size={32} color="#2D1B69" />
                                        <Text style={styles.cardValue}>{formatNumber(selectedSeller.totalMfys)}</Text>
                                        <Text style={styles.cardLabel}>MFYlar</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Service Areas Details */}
                        {selectedSeller && selectedSeller.serviceAreas && Array.isArray(selectedSeller.serviceAreas) && selectedSeller.serviceAreas.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Xizmat hududlari tafsilotlari</Text>
                                {selectedSeller.serviceAreas.map((area, index) => (
                                    <View key={index} style={styles.serviceAreaCard}>
                                        <Text style={styles.serviceAreaTitle}>Hudud {index + 1}</Text>
                                        <Text style={styles.serviceAreaRegion}>{area.region}</Text>
                                        {area.districts && Array.isArray(area.districts) && area.districts.length > 0 && (
                                            <View style={styles.serviceAreaDetails}>
                                                <Text style={styles.serviceAreaLabel}>Tumanlar:</Text>
                                                <Text style={styles.serviceAreaText}>{area.districts.join(', ')}</Text>
                                            </View>
                                        )}
                                        {area.mfys && Array.isArray(area.mfys) && area.mfys.length > 0 && (
                                            <View style={styles.serviceAreaDetails}>
                                                <Text style={styles.serviceAreaLabel}>MFYlar:</Text>
                                                <Text style={styles.serviceAreaText}>{area.mfys.join(', ')}</Text>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    selectorButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9ff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2D1B69',
    },
    selectorButtonText: {
        fontSize: 16,
        color: '#2D1B69',
        fontWeight: '500',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 4,
    },
    sellersList: {
        padding: 16,
    },
    sellerOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    selectedOption: {
        backgroundColor: '#2D1B69',
    },
    sellerOptionName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    sellerOptionUsername: {
        fontSize: 14,
        color: '#666',
    },
    selectedOptionText: {
        color: '#fff',
    },
    dateRangeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    dateButton: {
        flex: 1,
        backgroundColor: '#f8f9ff',
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#2D1B69',
    },
    dateButtonText: {
        color: '#2D1B69',
        fontSize: 14,
        textAlign: 'center',
    },
    statsContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
    },
    overviewContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    overviewCard: {
        width: '48%',
        alignItems: 'center',
    },
    cardValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D1B69',
        marginTop: 8,
        marginBottom: 4,
    },
    cardLabel: {
        fontSize: 14,
        color: '#666',
    },
    section: {
        padding: 16,
    },
    lastSection: {
        paddingBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D1B69',
        marginBottom: 12,
        marginTop: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#666',
        fontWeight: 'normal',
    },
    productCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    productHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    productValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D1B69',
    },
    productDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    productDetail: {
        fontSize: 14,
        color: '#666',
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    orderAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D1B69',
    },
    orderDate: {
        fontSize: 14,
        color: '#666',
    },
    activeStatus: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '500',
    },
    inactiveStatus: {
        fontSize: 14,
        color: '#FF6B6B',
        fontWeight: '500',
    },
    cancelledOrder: {
        opacity: 0.7,
        borderLeftColor: '#FF3B30',
    },
    orderStatus: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    orderAmountContainer: {
        alignItems: 'flex-end',
    },
    paymentMethod: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    orderProducts: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    orderProduct: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    listContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginTop: 8,
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    listItemName: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    listItemValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D1B69',
    },
    serviceAreaCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginTop: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#2D1B69',
    },
    serviceAreaTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 4,
    },
    serviceAreaRegion: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    serviceAreaDetails: {
        marginTop: 8,
    },
    serviceAreaLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    serviceAreaText: {
        fontSize: 14,
        color: '#333',
    },
}); 