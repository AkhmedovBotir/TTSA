const mongoose = require('mongoose');
const Region = require('../models/Region');
require('dotenv').config();

// O'zbekiston viloyatlari va tumanlari ma'lumotlari
const regionsData = {
    "Andijon viloyati": {
        code: "AND",
        districts: [
            "Andijon shahri", "Andijon tumani", "Asaka tumani", "Baliqchi tumani", 
            "Bo'z tumani", "Buloqboshi tumani", "Izboskan tumani", "Jalaquduq tumani",
            "Qo'rg'ontepa tumani", "Paxtaobod tumani", "Shahrixon tumani", "Ulug'nor tumani",
            "Xonobod tumani", "Xo'jaobod tumani"
        ]
    },
    "Buxoro viloyati": {
        code: "BUX",
        districts: [
            "Buxoro shahri", "Buxoro tumani", "Vobkent tumani", "G'ijduvon tumani",
            "Jondor tumani", "Kogon tumani", "Olot tumani", "Peshku tumani",
            "Qorako'l tumani", "Qorovulbozor tumani", "Romitan tumani", "Shofirkon tumani"
        ]
    },
    "Farg'ona viloyati": {
        code: "FAR",
        districts: [
            "Farg'ona shahri", "Beshariq tumani", "Bog'dod tumani", "Buvayda tumani",
            "Dang'ara tumani", "Farg'ona tumani", "Furqat tumani", "Qo'qon shahri",
            "Qo'qon tumani", "Qo'shtepa tumani", "Rishton tumani", "So'x tumani",
            "Toshloq tumani", "Uchko'prik tumani", "O'zbekiston tumani", "Yozyovon tumani"
        ]
    },
    "Jizzax viloyati": {
        code: "JIZ",
        districts: [
            "Jizzax shahri", "Arnasoy tumani", "Baxmal tumani", "Do'stlik tumani",
            "Forish tumani", "G'allaorol tumani", "Jizzax tumani", "Mirzacho'l tumani",
            "Paxtakor tumani", "Yangiobod tumani", "Zarbdor tumani", "Zafarobod tumani",
            "Zomin tumani"
        ]
    },
    "Xorazm viloyati": {
        code: "XOR",
        districts: [
            "Urganch shahri", "Bog'ot tumani", "Gurlan tumani", "Xonqa tumani",
            "Hazorasp tumani", "Xiva shahri", "Xiva tumani", "Qo'shko'pir tumani",
            "Shovot tumani", "Urganch tumani", "Yangiariq tumani", "Yangibozor tumani"
        ]
    },
    "Namangan viloyati": {
        code: "NAM",
        districts: [
            "Namangan shahri", "Chortoq tumani", "Chust tumani", "Kosonsoy tumani",
            "Mingbuloq tumani", "Namangan tumani", "Norin tumani", "Pop tumani",
            "To'raqo'rg'on tumani", "Uchqo'rg'on tumani", "Uychi tumani", "Yangiqo'rg'on tumani"
        ]
    },
    "Navoiy viloyati": {
        code: "NAV",
        districts: [
            "Navoiy shahri", "Karmana tumani", "Konimex tumani", "Navbahor tumani",
            "Nurota tumani", "Qiziltepa tumani", "Tomdi tumani", "Uchquduq tumani",
            "Xatirchi tumani", "Zarafshon shahri"
        ]
    },
    "Qashqadaryo viloyati": {
        code: "QAS",
        districts: [
            "Qarshi shahri", "Chiroqchi tumani", "Dehqonobod tumani", "G'uzor tumani",
            "Kasbi tumani", "Kitob tumani", "Koson tumani", "Mirishkor tumani",
            "Muborak tumani", "Nishon tumani", "Qamashi tumani", "Qarshi tumani",
            "Shahrisabz shahri", "Shahrisabz tumani", "Yakkabog' tumani"
        ]
    },
    "Qoraqalpog'iston Respublikasi": {
        code: "QOR",
        districts: [
            "Nukus shahri", "Amudaryo tumani", "Beruniy tumani", "Chimboy tumani",
            "Ellikqal'a tumani", "Kegayli tumani", "Mo'ynoq tumani", "Nukus tumani",
            "Qonliko'l tumani", "Qo'ng'irot tumani", "Qorao'zak tumani", "Shumanay tumani",
            "Taxtako'pir tumani", "To'rtko'l tumani", "Xo'jayli tumani"
        ]
    },
    "Samarqand viloyati": {
        code: "SAM",
        districts: [
            "Samarqand shahri", "Bulung'ur tumani", "Ishtixon tumani", "Jomboy tumani",
            "Kattaqo'rg'on shahri", "Kattaqo'rg'on tumani", "Kushrabot tumani", "Narpay tumani",
            "Nurobod tumani", "Oqdaryo tumani", "Paxtachi tumani", "Payariq tumani",
            "Pastdarg'om tumani", "Qo'shrabot tumani", "Samarqand tumani", "Toyloq tumani",
            "Urgut tumani"
        ]
    },
    "Sirdaryo viloyati": {
        code: "SIR",
        districts: [
            "Guliston shahri", "Boyovut tumani", "Guliston tumani", "Mirzaobod tumani",
            "Oqoltin tumani", "Sayxunobod tumani", "Sardoba tumani", "Sirdaryo tumani",
            "Xovos tumani", "Shirin shahri", "Yangiyer shahri"
        ]
    },
    "Surxondaryo viloyati": {
        code: "SUR",
        districts: [
            "Termiz shahri", "Angor tumani", "Bandixon tumani", "Boysun tumani",
            "Denov tumani", "Jarqo'rg'on tumani", "Qiziriq tumani", "Qumqo'rg'on tumani",
            "Muzrabot tumani", "Oltinsoy tumani", "Sariosiyo tumani", "Sherobod tumani",
            "Sho'rchi tumani", "Termiz tumani", "Uzun tumani"
        ]
    },
    "Toshkent viloyati": {
        code: "TOS",
        districts: [
            "Angren shahri", "Bekobod shahri", "Chirchiq shahri", "Nurafshon shahri",
            "Olmaliq shahri", "O'rtachirchiq tumani", "Bekobod tumani", "Bo'ka tumani",
            "Bo'stonliq tumani", "Chinoz tumani", "Chirchiq tumani", "Ohangaron tumani",
            "Oqqo'rg'on tumani", "Parkent tumani", "Piskent tumani", "Quyi chirchiq tumani",
            "Qibray tumani", "Toshkent tumani", "Yangiyo'l shahri", "Yangiyo'l tumani",
            "Yuqori chirchiq tumani", "Zangiota tumani"
        ]
    }
};

// MFY nomlari (har bir tuman uchun)
const mfyNames = [
    "1-MFY", "2-MFY", "3-MFY", "4-MFY", "5-MFY", "6-MFY", "7-MFY", "8-MFY", "9-MFY", "10-MFY",
    "11-MFY", "12-MFY", "13-MFY", "14-MFY", "15-MFY", "16-MFY", "17-MFY", "18-MFY", "19-MFY", "20-MFY",
    "21-MFY", "22-MFY", "23-MFY", "24-MFY", "25-MFY", "26-MFY", "27-MFY", "28-MFY", "29-MFY", "30-MFY"
];

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB ga ulanish muvaffaqiyatli');
    } catch (error) {
        console.error('MongoDB ga ulanishda xatolik:', error);
        process.exit(1);
    }
}

async function clearExistingData() {
    try {
        await Region.deleteMany({});
        console.log('Mavjud region ma\'lumotlari o\'chirildi');
    } catch (error) {
        console.error('Ma\'lumotlarni o\'chirishda xatolik:', error);
    }
}

async function seedRegions() {
    try {
        console.log('Region ma\'lumotlarini qo\'shish boshlandi...');
        
        const createdRegions = {};
        let totalCount = 0;

        // 1. Viloyatlarni qo'shish
        console.log('Viloyatlar qo\'shilmoqda...');
        for (const [regionName, regionData] of Object.entries(regionsData)) {
            const region = new Region({
                name: regionName,
                type: 'region',
                code: regionData.code,
                status: 'active'
            });
            
            const savedRegion = await region.save();
            createdRegions[regionName] = savedRegion._id;
            totalCount++;
            console.log(`✓ ${regionName} qo'shildi`);
        }

        // 2. Tumanlarni qo'shish
        console.log('Tumanlar qo\'shilmoqda...');
        for (const [regionName, regionData] of Object.entries(regionsData)) {
            const regionId = createdRegions[regionName];
            
            for (let i = 0; i < regionData.districts.length; i++) {
                const districtName = regionData.districts[i];
                const districtCode = `${regionData.code}${String(i + 1).padStart(3, '0')}`;
                
                const district = new Region({
                    name: districtName,
                    type: 'district',
                    parent: regionId,
                    code: districtCode,
                    status: 'active'
                });
                
                const savedDistrict = await district.save();
                createdRegions[`${regionName}_${districtName}`] = savedDistrict._id;
                totalCount++;
                console.log(`  ✓ ${districtName} qo'shildi`);
            }
        }

        // 3. MFY larni qo'shish
        console.log('MFY lar qo\'shilmoqda...');
        for (const [regionName, regionData] of Object.entries(regionsData)) {
            for (const districtName of regionData.districts) {
                const districtId = createdRegions[`${regionName}_${districtName}`];
                const regionCode = regionData.code;
                
                // Har bir tuman uchun 5-15 ta MFY qo'shamiz
                const mfyCount = Math.floor(Math.random() * 11) + 5; // 5-15 ta
                
                for (let i = 0; i < mfyCount; i++) {
                    const mfyName = mfyNames[i];
                    const mfyCode = `${regionCode}${String(regionData.districts.indexOf(districtName) + 1).padStart(3, '0')}${String(i + 1).padStart(2, '0')}`;
                    
                    const mfy = new Region({
                        name: mfyName,
                        type: 'mfy',
                        parent: districtId,
                        code: mfyCode,
                        status: 'active'
                    });
                    
                    await mfy.save();
                    totalCount++;
                }
                console.log(`    ✓ ${districtName} uchun ${mfyCount} ta MFY qo'shildi`);
            }
        }

        console.log(`\n🎉 Barcha ma'lumotlar muvaffaqiyatli qo'shildi!`);
        console.log(`📊 Jami: ${totalCount} ta region qo'shildi`);
        
        // Statistika
        const regionCount = await Region.countDocuments({ type: 'region' });
        const districtCount = await Region.countDocuments({ type: 'district' });
        const mfyCount = await Region.countDocuments({ type: 'mfy' });
        
        console.log(`📈 Statistika:`);
        console.log(`   - Viloyatlar: ${regionCount}`);
        console.log(`   - Tumanlar: ${districtCount}`);
        console.log(`   - MFY lar: ${mfyCount}`);

    } catch (error) {
        console.error('Region ma\'lumotlarini qo\'shishda xatolik:', error);
    }
}

async function main() {
    try {
        await connectDB();
        await clearExistingData();
        await seedRegions();
        
        console.log('\n✅ Script muvaffaqiyatli yakunlandi!');
        process.exit(0);
    } catch (error) {
        console.error('Script ishlashida xatolik:', error);
        process.exit(1);
    }
}

// Script ni ishga tushirish
if (require.main === module) {
    main();
}

module.exports = { seedRegions, regionsData };


