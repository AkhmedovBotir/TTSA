const mongoose = require('mongoose');
const Region = require('../models/Region');
require('dotenv').config();

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB ga ulanish muvaffaqiyatli');
    } catch (error) {
        console.error('MongoDB ga ulanishda xatolik:', error);
        process.exit(1);
    }
}

async function testRegions() {
    try {
        console.log('Region ma\'lumotlarini tekshirish...\n');
        
        // Statistika
        const totalCount = await Region.countDocuments();
        const regionCount = await Region.countDocuments({ type: 'region' });
        const districtCount = await Region.countDocuments({ type: 'district' });
        const mfyCount = await Region.countDocuments({ type: 'mfy' });
        
        console.log('📊 Umumiy statistika:');
        console.log(`   - Jami regionlar: ${totalCount}`);
        console.log(`   - Viloyatlar: ${regionCount}`);
        console.log(`   - Tumanlar: ${districtCount}`);
        console.log(`   - MFY lar: ${mfyCount}\n`);
        
        // Bir nechta viloyatni ko'rsatish
        console.log('🏛️ Viloyatlar ro\'yxati:');
        const regions = await Region.find({ type: 'region' }).sort({ name: 1 });
        regions.forEach((region, index) => {
            console.log(`   ${index + 1}. ${region.name} (${region.code})`);
        });
        
        // Bir viloyatning tumanlarini ko'rsatish
        if (regions.length > 0) {
            const firstRegion = regions[0];
            console.log(`\n🏘️ ${firstRegion.name} tumanlari:`);
            const districts = await Region.find({ 
                type: 'district', 
                parent: firstRegion._id 
            }).sort({ name: 1 });
            
            districts.forEach((district, index) => {
                console.log(`   ${index + 1}. ${district.name} (${district.code})`);
            });
            
            // Bir tumanning MFY larini ko'rsatish
            if (districts.length > 0) {
                const firstDistrict = districts[0];
                console.log(`\n🏠 ${firstDistrict.name} MFY lari:`);
                const mfys = await Region.find({ 
                    type: 'mfy', 
                    parent: firstDistrict._id 
                }).sort({ name: 1 });
                
                mfys.forEach((mfy, index) => {
                    console.log(`   ${index + 1}. ${mfy.name} (${mfy.code})`);
                });
            }
        }
        
        // Kodlar tekshiruvi
        console.log('\n🔍 Kodlar tekshiruvi:');
        const duplicateCodes = await Region.aggregate([
            { $group: { _id: '$code', count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } }
        ]);
        
        if (duplicateCodes.length > 0) {
            console.log('   ⚠️ Duplikat kodlar topildi:');
            duplicateCodes.forEach(dup => {
                console.log(`   - ${dup._id}: ${dup.count} ta`);
            });
        } else {
            console.log('   ✅ Barcha kodlar unique');
        }
        
        // Parent-child munosabatlari tekshiruvi
        console.log('\n🔗 Parent-child munosabatlari:');
        const orphanDistricts = await Region.countDocuments({ 
            type: 'district', 
            parent: null 
        });
        const orphanMfys = await Region.countDocuments({ 
            type: 'mfy', 
            parent: null 
        });
        
        if (orphanDistricts > 0) {
            console.log(`   ⚠️ Parent'siz tumanlar: ${orphanDistricts}`);
        }
        if (orphanMfys > 0) {
            console.log(`   ⚠️ Parent'siz MFY lar: ${orphanMfys}`);
        }
        if (orphanDistricts === 0 && orphanMfys === 0) {
            console.log('   ✅ Barcha parent-child munosabatlari to\'g\'ri');
        }
        
    } catch (error) {
        console.error('Test ishlashida xatolik:', error);
    }
}

async function main() {
    try {
        await connectDB();
        await testRegions();
        
        console.log('\n✅ Test muvaffaqiyatli yakunlandi!');
        process.exit(0);
    } catch (error) {
        console.error('Test ishlashida xatolik:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { testRegions };


