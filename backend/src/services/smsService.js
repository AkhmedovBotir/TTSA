const axios = require('axios');

class EskizSmsService {
	constructor() {
        this.baseURL = 'https://notify.eskiz.uz/api';
        this.email = process.env.ESKIZ_EMAIL;
        this.password = process.env.ESKIZ_PASSWORD;
        this.token = null;
        this.tokenExpiry = null;
    }

    // Token olish
    async getToken() {
        try {
            // Environment variables ni tekshirish
            if (!this.email || !this.password) {
                console.error('Eskiz credentials mavjud emas. ESKIZ_EMAIL va ESKIZ_PASSWORD o\'rnatilishi kerak.');
                throw new Error('Eskiz credentials mavjud emas');
            }

            // Agar token mavjud va hali amal qilsa, uni qaytarish
            if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
                return this.token;
            }

            const response = await axios.post(`${this.baseURL}/auth/login`, {
                email: this.email,
                password: this.password
            });

            // Response struktura: { message: 'token_generated', data: { token: '...' }, token_type: 'bearer' }
            if (response.data && response.data.data && response.data.data.token) {
                this.token = response.data.data.token;
                // Token 30 kun amal qiladi
                this.tokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                return this.token;
            } else {
                console.error('Token topilmadi. Response:', response.data);
                throw new Error('Token olinmadi');
            }
        } catch (error) {
            console.error('Eskiz token olishda xatolik:', error.response?.data || error.message);
            throw new Error('SMS xizmati bilan bog\'lanishda xatolik');
        }
    }

    // SMS yuborish
    async sendSms(phoneNumber, message) {
        try {
            const token = await this.getToken();
            
            const response = await axios.post(`${this.baseURL}/message/sms/send`, {
                mobile_phone: phoneNumber,
                message: message,
                from: '4546' // Eskiz.uz dan berilgan sender name
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Eskiz.uz response struktura: { message: 'success', data: { id: '...', status: '...' } }
            if (response.data && response.data.message === 'success') {
                return {
                    success: true,
                    messageId: response.data.data?.id || 'unknown',
                    message: 'SMS muvaffaqiyatli yuborildi'
                };
            } else if (response.data && response.data.message === 'Waiting for SMS provider') {
                // Bu normal holat - SMS provider kutayotgan
                return {
                    success: true,
                    messageId: response.data.data?.id || 'pending',
                    message: 'SMS yuborish jarayoni boshlandi'
                };
            } else {
                console.error('SMS yuborishda kutilmagan response:', response.data);
                throw new Error(response.data?.message || 'SMS yuborishda xatolik');
            }
        } catch (error) {
            console.error('SMS yuborishda xatolik:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // SMS kod yuborish (maxsus format)
    async sendSmsCode(phoneNumber, code, purpose = 'login') {
        try {
            let message = '';
            
            switch (purpose) {
                case 'login':
                    message = `Talab va Taklif Agency platformasiga kirish uchun tasdiqlash kodi: ${code}. Kod 5 daqiqa amal qiladi.`;
                    break;
                case 'register':
                    message = `Talab va Taklif Agency platformasida ro'yxatdan o'tish uchun kod: ${code}. Amal 5 daqiqa.`;
                    break;
                case 'reset_password':
                    message = `Talab va Taklif Agency platformasida parolingizni tiklash uchun tasdiqlash kodi: ${code}. Kod 5 daqiqa amal qiladi.`;
                    break;
                default:
                    message = `Talab va Taklif Agency platformasida tasdiqlash kodi: ${code}. Kod 5 daqiqa amal qiladi.`;
            }

            return await this.sendSms(phoneNumber, message);
        } catch (error) {
            console.error('SMS kod yuborishda xatolik:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // SMS holatini tekshirish
    async getSmsStatus(messageId) {
        try {
            const token = await this.getToken();
            
            const response = await axios.get(`${this.baseURL}/message/sms/get-status/${messageId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return {
                success: true,
                status: response.data.status,
                data: response.data
            };
        } catch (error) {
            console.error('SMS holatini tekshirishda xatolik:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Balansni tekshirish
    async getBalance() {
        try {
            const token = await this.getToken();
            
            const response = await axios.get(`${this.baseURL}/auth/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

		return {
			success: true,
                balance: response.data.balance,
                data: response.data
            };
        } catch (error) {
            console.error('Balansni tekshirishda xatolik:', error.response?.data || error.message);
		return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }
}

// Singleton instance
const eskizSmsService = new EskizSmsService();

// Legacy interface for backward compatibility
const smsService = {
    async sendSmsCode(phoneNumber, code, purpose = 'login') {
        return await eskizSmsService.sendSmsCode(phoneNumber, code, purpose);
    },

    async sendSms(phoneNumber, message) {
        return await eskizSmsService.sendSms(phoneNumber, message);
    },

    async getSmsStatus(messageId) {
        return await eskizSmsService.getSmsStatus(messageId);
    },

    async getBalance() {
        return await eskizSmsService.getBalance();
    }
};

module.exports = smsService;
