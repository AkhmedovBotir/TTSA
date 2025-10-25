module.exports = {
    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
        expiresIn: '24h' // Token expiration time
    },
    
    // Database configuration
    database: {
        url: process.env.DATABASE_URL || 'mongodb://localhost:27017/your_database_name',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    },
    
    // Server configuration
    server: {
        port: process.env.PORT || 3000,
        environment: process.env.NODE_ENV || 'development'
    },
    
    // Other configurations can be added here
    app: {
        name: 'Your App Name'
    }
};
