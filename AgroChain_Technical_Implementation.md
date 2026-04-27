# AgroChain Technical Implementation Guide

## Overview
This document provides detailed technical implementation guidance for building the AgroChain decentralized agricultural supply chain system on Stellar.

## 1. Development Environment Setup

### 1.1 Prerequisites
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Stellar CLI
cargo install stellar-cli

# Install Soroban CLI
cargo install soroban-cli

# Install Node.js (for frontend)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

### 1.2 Project Structure
```
agrochain/
├── contracts/                 # Stellar smart contracts
│   ├── product-registry/
│   ├── supply-chain/
│   ├── quality-assurance/
│   ├── payment-processor/
│   └── shared/
├── backend/                   # Node.js/Python backend
│   ├── api-gateway/
│   ├── microservices/
│   │   ├── auth-service/
│   │   ├── notification-service/
│   │   ├── oracle-service/
│   │   └── analytics-service/
│   └── database/
├── frontend/                  # Web applications
│   ├── farmer-dashboard/
│   ├── processor-portal/
│   ├── distributor-platform/
│   ├── consumer-app/
│   └── regulatory-dashboard/
├── mobile/                    # React Native apps
│   ├── farmer-app/
│   ├── consumer-app/
│   └── scanner-app/
├── iot/                       # IoT firmware and integration
│   ├── sensor-firmware/
│   ├── gateway-software/
│   └── edge-computing/
├── infrastructure/            # DevOps and deployment
│   ├── docker/
│   ├── kubernetes/
│   ├── terraform/
│   └── monitoring/
├── tests/                     # Testing suite
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── load/
└── docs/                      # Documentation
    ├── api/
    ├── user-guides/
    └── technical/
```

### 1.3 Development Tools Configuration
```toml
# Cargo.toml (workspace level)
[workspace]
members = [
    "contracts/product-registry",
    "contracts/supply-chain", 
    "contracts/quality-assurance",
    "contracts/payment-processor",
    "contracts/shared"
]

[workspace.dependencies]
soroban-sdk = "20.0.0"
soroban-token-sdk = "20.0.0"

[profile.release]
opt-level = "z"
overflow-checks = true
debug = 0
strip = "symbols"
debug-assertions = false
panic = "abort"
codegen-units = 1
lto = true
```

## 2. Smart Contract Development

### 2.1 Contract Template Structure
```rust
// contracts/shared/src/lib.rs
pub mod types;
pub mod errors;
pub mod events;
pub mod utils;

// contracts/shared/src/types.rs
use soroban_sdk::{Address, Bytes, Symbol, Vec, Map};

#[derive(Clone, Debug)]
pub struct Product {
    pub id: Bytes,
    pub name: Symbol,
    pub category: ProductCategory,
    pub farmer: Address,
    pub created_at: u64,
    pub metadata_hash: Bytes,
    pub current_status: ProductStatus,
}

#[derive(Clone, Debug, PartialEq)]
pub enum ProductCategory {
    Grains,
    Vegetables,
    Fruits,
    Dairy,
    Meat,
    Other(Symbol),
}

#[derive(Clone, Debug, PartialEq)]
pub enum ProductStatus {
    Registered,
    Growing,
    Harvested,
    Processing,
    Transport,
    Storage,
    Retail,
    Consumed,
    Recalled,
}

// contracts/shared/src/errors.rs
use soroban_sdk::Error;

#[derive(Error, Debug, Clone)]
pub enum AgroChainError {
    #[error("Product not found")]
    ProductNotFound,
    
    #[error("Unauthorized access")]
    Unauthorized,
    
    #[error("Invalid status transition")]
    InvalidStatusTransition,
    
    #[error("Insufficient balance")]
    InsufficientBalance,
    
    #[error("Quality check failed")]
    QualityCheckFailed,
    
    #[error("Certificate expired")]
    CertificateExpired,
}
```

### 2.2 Contract Testing Framework
```rust
// contracts/product-registry/tests/test.rs
use soroban_sdk::{Env, Address, Symbol};
use agrochain_product_registry::{ProductRegistry, Product, ProductStatus};

#[test]
fn test_product_lifecycle() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ProductRegistry);
    let client = ProductRegistryClient::new(&env, &contract_id);
    
    // Setup test accounts
    let farmer = Address::generate(&env);
    let processor = Address::generate(&env);
    
    // Test product registration
    let product_id = client.register_product(
        &farmer,
        &Symbol::new(&env, "Organic Tomatoes"),
        &ProductCategory::Vegetables,
        &Location {
            latitude: 40.7128,
            longitude: -74.0060,
            address: Symbol::new(&env, "123 Farm Road"),
            country: Symbol::new(&env, "USA"),
        },
        &Bytes::from_slice(&env, b"metadata_hash"),
    );
    
    // Verify product creation
    let product = client.get_product(&product_id);
    assert_eq!(product.farmer, farmer);
    assert_eq!(product.current_status, ProductStatus::Registered);
    
    // Test status transition
    client.update_status(
        &product_id,
        &ProductStatus::Growing,
        &farmer,
    );
    
    let updated_product = client.get_product(&product_id);
    assert_eq!(updated_product.current_status, ProductStatus::Growing);
    
    // Test unauthorized access
    let result = std::panic::catch_unwind(|| {
        client.update_status(
            &product_id,
            &ProductStatus::Harvested,
            &processor,
        );
    });
    assert!(result.is_err());
}

#[test]
fn test_batch_operations() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ProductRegistry);
    let client = ProductRegistryClient::new(&env, &contract_id);
    
    let farmer = Address::generate(&env);
    
    // Create multiple products
    let mut product_ids = Vec::new(&env);
    for i in 0..10 {
        let product_id = client.register_product(
            &farmer,
            &Symbol::new(&env, &format!("Product {}", i)),
            &ProductCategory::Vegetables,
            &default_location(),
            &Bytes::from_slice(&env, &format!("hash_{}", i).as_bytes()),
        );
        product_ids.push_back(product_id);
    }
    
    // Verify all products exist
    let farmer_products = client.get_farmer_products(&farmer);
    assert_eq!(farmer_products.len(), 10);
}
```

### 2.3 Contract Deployment Script
```rust
// scripts/deploy.rs
use soroban_sdk::{Env, Address};
use agrochain_contracts::{ProductRegistry, SupplyChain, QualityAssurance, PaymentProcessor};

fn main() {
    let env = Env::default();
    
    // Deploy contracts
    let product_registry_id = deploy_contract::<ProductRegistry>(&env);
    let supply_chain_id = deploy_contract::<SupplyChain>(&env);
    let quality_assurance_id = deploy_contract::<QualityAssurance>(&env);
    let payment_processor_id = deploy_contract::<PaymentProcessor>(&env);
    
    // Initialize contracts
    initialize_contracts(&env, &ContractAddresses {
        product_registry: product_registry_id,
        supply_chain: supply_chain_id,
        quality_assurance: quality_assurance_id,
        payment_processor: payment_processor_id,
    });
    
    println!("Contracts deployed successfully!");
    println!("Product Registry: {}", product_registry_id);
    println!("Supply Chain: {}", supply_chain_id);
    println!("Quality Assurance: {}", quality_assurance_id);
    println!("Payment Processor: {}", payment_processor_id);
}

fn deploy_contract<T>(env: &Env) -> Address {
    let contract_id = env.register_contract(None, T);
    contract_id
}

fn initialize_contracts(env: &Env, addresses: &ContractAddresses) {
    // Set up cross-contract references
    let product_registry_client = ProductRegistryClient::new(env, &addresses.product_registry);
    product_registry_client.initialize(&addresses.supply_chain, &addresses.quality_assurance);
    
    // Initialize other contracts...
}
```

## 3. Backend Development

### 3.1 API Gateway Setup
```javascript
// backend/api-gateway/package.json
{
  "name": "agrochain-api-gateway",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^6.0.0",
    "rate-limiter-flexible": "^2.4.0",
    "stellar-sdk": "^10.0.0",
    "redis": "^4.0.0",
    "winston": "^3.8.0",
    "joi": "^17.7.0",
    "jsonwebtoken": "^9.0.0"
  }
}

// backend/api-gateway/src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const StellarSDK = require('stellar-sdk');
const Redis = require('redis');

class APIGateway {
    constructor() {
        this.app = express();
        this.stellarServer = new StellarSDK.Server('https://horizon-testnet.stellar.org');
        this.redis = Redis.createClient();
        this.rateLimiter = new RateLimiterMemory({
            keyGenerator: (req) => req.ip,
            points: 100,
            duration: 60,
        });
        
        this.setupMiddleware();
        this.setupRoutes();
    }
    
    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json());
        
        // Rate limiting
        this.app.use(async (req, res, next) => {
            try {
                await this.rateLimiter.consume(req.ip);
                next();
            } catch (rejRes) {
                res.status(429).json({ error: 'Too many requests' });
            }
        });
        
        // Authentication
        this.app.use(async (req, res, next) => {
            if (req.path.startsWith('/public')) {
                return next();
            }
            
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'No token provided' });
            }
            
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = decoded;
                next();
            } catch (error) {
                res.status(401).json({ error: 'Invalid token' });
            }
        });
    }
    
    setupRoutes() {
        // Product routes
        this.app.post('/api/products', this.createProduct.bind(this));
        this.app.get('/api/products/:id', this.getProduct.bind(this));
        this.app.put('/api/products/:id/status', this.updateProductStatus.bind(this));
        
        // Supply chain routes
        this.app.post('/api/shipments', this.createShipment.bind(this));
        this.app.put('/api/shipments/:id/status', this.updateShipmentStatus.bind(this));
        this.app.get('/api/shipments/:id', this.getShipment.bind(this));
        
        // Quality routes
        this.app.post('/api/quality/reports', this.submitQualityReport.bind(this));
        this.app.post('/api/quality/certificates', this.issueCertificate.bind(this));
        
        // Payment routes
        this.app.post('/api/payments', this.createPayment.bind(this));
        this.app.post('/api/payments/:id/release', this.releasePayment.bind(this));
        
        // IoT routes
        this.app.post('/api/iot/data', this.submitIoTData.bind(this));
    }
    
    async createProduct(req, res) {
        try {
            const { name, category, origin, metadata } = req.body;
            
            // Validate input
            const schema = Joi.object({
                name: Joi.string().required(),
                category: Joi.string().valid('grains', 'vegetables', 'fruits', 'dairy', 'meat').required(),
                origin: Joi.object({
                    latitude: Joi.number().required(),
                    longitude: Joi.number().required(),
                    address: Joi.string().required(),
                    country: Joi.string().required(),
                }).required(),
                metadata: Joi.object().required(),
            });
            
            const { error } = schema.validate(req.body);
            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }
            
            // Call smart contract
            const contract = new StellarSDK.Contract(this.productRegistryAddress);
            const operation = contract.call(
                'register_product',
                ...this.formatProductArgs(req.user.address, name, category, origin, metadata)
            );
            
            const transaction = new StellarSDK.TransactionBuilder(
                await this.stellarServer.loadAccount(req.user.address),
                { networkPassphrase: StellarSDK.Networks.TESTNET }
            )
            .addOperation(operation)
            .setTimeout(30)
            .build();
            
            transaction.sign(StellarSDK.Keypair.fromSecret(req.user.secret));
            const result = await this.stellarServer.submitTransaction(transaction);
            
            res.json({
                success: true,
                transactionHash: result.hash,
                productId: this.extractProductIdFromResult(result),
            });
            
        } catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async getProduct(req, res) {
        try {
            const { id } = req.params;
            
            // Try cache first
            const cached = await this.redis.get(`product:${id}`);
            if (cached) {
                return res.json(JSON.parse(cached));
            }
            
            // Query smart contract
            const contract = new StellarSDK.Contract(this.productRegistryAddress);
            const result = await contract.call('get_product', id);
            
            const product = this.parseProductResult(result);
            
            // Cache for 5 minutes
            await this.redis.setex(`product:${id}`, 300, JSON.stringify(product));
            
            res.json(product);
            
        } catch (error) {
            console.error('Error getting product:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

const gateway = new APIGateway();
gateway.app.listen(3000, () => {
    console.log('API Gateway running on port 3000');
});
```

### 3.2 Microservice Architecture
```javascript
// backend/microservices/auth-service/src/index.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const StellarSDK = require('stellar-sdk');

class AuthService {
    constructor() {
        this.app = express();
        this.app.use(express.json());
        this.setupRoutes();
    }
    
    setupRoutes() {
        this.app.post('/register', this.register.bind(this));
        this.app.post('/login', this.login.bind(this));
        this.app.post('/refresh', this.refresh.bind(this));
        this.app.get('/profile', this.getProfile.bind(this));
    }
    
    async register(req, res) {
        try {
            const { email, password, role, stellarPublicKey } = req.body;
            
            // Validate input
            if (!email || !password || !role || !stellarPublicKey) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Create Stellar account if needed
            const account = await this.createStellarAccount(stellarPublicKey);
            
            // Save user to database
            const user = await this.saveUser({
                email,
                password: hashedPassword,
                role,
                stellarPublicKey: account.publicKey(),
                stellarSecret: account.secret(), // Encrypt this in production
            });
            
            // Generate tokens
            const accessToken = jwt.sign(
                { userId: user.id, email, role, stellarPublicKey: account.publicKey() },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );
            
            const refreshToken = jwt.sign(
                { userId: user.id },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '7d' }
            );
            
            res.json({
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    stellarPublicKey: account.publicKey(),
                },
            });
            
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }
    
    async createStellarAccount(publicKey) {
        // In production, this would use a funded account to create new accounts
        // For now, we'll assume the account already exists
        return StellarSDK.Keypair.fromPublicKey(publicKey);
    }
}

// backend/microservices/oracle-service/src/index.js
const express = require('express');
const axios = require('axios');
const StellarSDK = require('stellar-sdk');

class OracleService {
    constructor() {
        this.app = express();
        this.app.use(express.json());
        this.setupRoutes();
    }
    
    setupRoutes() {
        this.app.post('/weather', this.getWeatherData.bind(this));
        this.app.post('/market-prices', this.getMarketPrices.bind(this));
        this.app.post('/iot-data', this.processIoTData.bind(this));
    }
    
    async processIoTData(req, res) {
        try {
            const { deviceId, data, shipmentId } = req.body;
            
            // Validate IoT data
            const validatedData = this.validateIoTData(data);
            
            // Check for anomalies
            const anomalies = this.detectAnomalies(validatedData);
            
            if (anomalies.length > 0) {
                // Trigger alerts
                await this.triggerAlerts(shipmentId, anomalies);
            }
            
            // Store data
            await this.storeIoTData(deviceId, validatedData, shipmentId);
            
            // Update smart contract if needed
            if (this.shouldUpdateContract(anomalies)) {
                await this.updateContractWithIoTData(shipmentId, validatedData);
            }
            
            res.json({
                success: true,
                anomalies,
                stored: true,
            });
            
        } catch (error) {
            console.error('IoT data processing error:', error);
            res.status(500).json({ error: 'Processing failed' });
        }
    }
    
    validateIoTData(data) {
        const schema = {
            temperature: { min: -20, max: 50, required: true },
            humidity: { min: 0, max: 100, required: true },
            location: { required: true },
            timestamp: { required: true },
        };
        
        const validated = {};
        for (const [key, rules] of Object.entries(schema)) {
            if (rules.required && !data[key]) {
                throw new Error(`Missing required field: ${key}`);
            }
            
            if (data[key] !== undefined) {
                const value = data[key];
                if (rules.min && value < rules.min) {
                    throw new Error(`${key} below minimum: ${value} < ${rules.min}`);
                }
                if (rules.max && value > rules.max) {
                    throw new Error(`${key} above maximum: ${value} > ${rules.max}`);
                }
                validated[key] = value;
            }
        }
        
        return validated;
    }
    
    detectAnomalies(data) {
        const anomalies = [];
        
        // Temperature anomalies
        if (data.temperature < 2 || data.temperature > 8) {
            anomalies.push({
                type: 'temperature',
                severity: data.temperature < 0 || data.temperature > 10 ? 'high' : 'medium',
                message: `Temperature out of range: ${data.temperature}°C`,
            });
        }
        
        // Humidity anomalies
        if (data.humidity > 90) {
            anomalies.push({
                type: 'humidity',
                severity: 'medium',
                message: `High humidity: ${data.humidity}%`,
            });
        }
        
        // Location anomalies (if moving too fast)
        if (data.previousLocation && data.location) {
            const distance = this.calculateDistance(data.previousLocation, data.location);
            const timeDiff = data.timestamp - data.previousTimestamp;
            const speed = distance / (timeDiff / 3600); // km/h
            
            if (speed > 120) { // Unlikely speed for agricultural transport
                anomalies.push({
                    type: 'location',
                    severity: 'high',
                    message: `Unlikely movement speed: ${speed.toFixed(2)} km/h`,
                });
            }
        }
        
        return anomalies;
    }
}
```

## 4. Frontend Development

### 4.1 React Application Structure
```javascript
// frontend/farmer-dashboard/package.json
{
  "name": "agrochain-farmer-dashboard",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "@stellar/freighter-api": "^1.5.0",
    "axios": "^1.0.0",
    "react-query": "^3.39.0",
    "recharts": "^2.0.0",
    "react-hook-form": "^7.0.0",
    "tailwindcss": "^3.0.0",
    "lucide-react": "^0.263.0"
  }
}

// frontend/farmer-dashboard/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from './contexts/AuthContext';
import { StellarProvider } from './contexts/StellarContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Shipments from './pages/Shipments';
import Quality from './pages/Quality';
import Payments from './pages/Payments';
import Profile from './pages/Profile';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StellarProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/shipments" element={<Shipments />} />
                <Route path="/quality" element={<Quality />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </Layout>
          </Router>
        </StellarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### 4.2 Stellar Integration Hook
```javascript
// frontend/farmer-dashboard/src/hooks/useStellar.js
import { useState, useEffect, useContext } from 'react';
import { StellarContext } from '../contexts/StellarContext';
import { SERVER_URL, CONTRACT_ADDRESS } from '../config/stellar';

export const useStellar = () => {
  const { account, isConnected, connect } = useContext(StellarContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callContract = async (method, ...args) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${SERVER_URL}/api/contract/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          contractAddress: CONTRACT_ADDRESS.PRODUCT_REGISTRY,
          method,
          args,
          account,
        }),
      });

      if (!response.ok) {
        throw new Error('Contract call failed');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerProduct = async (productData) => {
    return callContract('register_product', productData);
  };

  const updateProductStatus = async (productId, newStatus) => {
    return callContract('update_status', productId, newStatus);
  };

  const getProduct = async (productId) => {
    return callContract('get_product', productId);
  };

  const getFarmerProducts = async () => {
    return callContract('get_farmer_products', account);
  };

  const createShipment = async (shipmentData) => {
    return callContract('create_shipment', shipmentData);
  };

  const submitQualityReport = async (reportData) => {
    return callContract('submit_quality_report', reportData);
  };

  return {
    isConnected,
    loading,
    error,
    connect,
    registerProduct,
    updateProductStatus,
    getProduct,
    getFarmerProducts,
    createShipment,
    submitQualityReport,
  };
};
```

### 4.3 Product Registration Component
```javascript
// frontend/farmer-dashboard/src/components/ProductRegistration.js
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useStellar } from '../hooks/useStellar';
import { Upload, MapPin, Package, Calendar } from 'lucide-react';

const ProductRegistration = () => {
  const { registerProduct, loading } = useStellar();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [location, setLocation] = useState(null);
  const [metadata, setMetadata] = useState({});

  const onSubmit = async (data) => {
    try {
      const productData = {
        name: data.name,
        category: data.category,
        origin: location,
        metadata: {
          ...metadata,
          plantingDate: data.plantingDate,
          expectedHarvest: data.expectedHarvest,
          farmingMethod: data.farmingMethod,
          soilType: data.soilType,
        },
      };

      const result = await registerProduct(productData);
      
      // Show success message
      alert(`Product registered successfully! Product ID: ${result.productId}`);
      
      // Reset form
      window.location.reload();
    } catch (error) {
      alert(`Registration failed: ${error.message}`);
    }
  };

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation);
  };

  const handleMetadataChange = (key, value) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center mb-6">
        <Package className="w-8 h-8 text-green-600 mr-3" />
        <h1 className="text-2xl font-bold text-gray-800">Register New Product</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                {...register('name', { required: 'Product name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Organic Tomatoes"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select category</option>
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
                <option value="grains">Grains</option>
                <option value="dairy">Dairy</option>
                <option value="meat">Meat</option>
              </select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Farm Location
          </h2>
          
          <LocationPicker onLocationSelect={handleLocationSelect} />
        </div>

        {/* Farming Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Farming Details</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Planting Date
              </label>
              <input
                type="date"
                {...register('plantingDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Harvest
              </label>
              <input
                type="date"
                {...register('expectedHarvest')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Farming Method
              </label>
              <select
                {...register('farmingMethod')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="organic">Organic</option>
                <option value="conventional">Conventional</option>
                <option value="hydroponic">Hydroponic</option>
                <option value="greenhouse">Greenhouse</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Soil Type
              </label>
              <select
                {...register('soilType')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="clay">Clay</option>
                <option value="sandy">Sandy</option>
                <option value="loamy">Loamy</option>
                <option value="silt">Silt</option>
              </select>
            </div>
          </div>
        </div>

        {/* Additional Metadata */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fertilizers Used
              </label>
              <input
                type="text"
                value={metadata.fertilizers || ''}
                onChange={(e) => handleMetadataChange('fertilizers', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Organic compost, NPK 10-10-10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Irrigation Method
              </label>
              <select
                value={metadata.irrigation || ''}
                onChange={(e) => handleMetadataChange('irrigation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select method</option>
                <option value="drip">Drip Irrigation</option>
                <option value="sprinkler">Sprinkler</option>
                <option value="flood">Flood Irrigation</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Yield (kg)
              </label>
              <input
                type="number"
                value={metadata.expectedYield || ''}
                onChange={(e) => handleMetadataChange('expectedYield', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !location}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Registering...' : 'Register Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductRegistration;
```

## 5. IoT Integration

### 5.1 Sensor Firmware (Arduino/C++)
```cpp
// iot/sensor-firmware/sensor_node.cpp
#include <WiFi.h>
#include <LoRa.h>
#include <DHT.h>
#include <GPS.h>
#include <ArduinoJson.h>

#define DHT_PIN 4
#define DHT_TYPE DHT22
#define LORA_SS 5
#define LORA_RST 14
#define LORA_DIO0 2
#define GPS_RX 16
#define GPS_TX 17

DHT dht(DHT_PIN, DHT_TYPE);
HardwareSerial gpsSerial(1);

struct SensorData {
  float temperature;
  float humidity;
  float latitude;
  float longitude;
  unsigned long timestamp;
  String deviceId;
  float batteryLevel;
};

class AgroChainSensorNode {
private:
  String deviceId;
  String gatewayId;
  unsigned long lastTransmission = 0;
  const unsigned long TRANSMISSION_INTERVAL = 60000; // 1 minute
  
public:
  void setup() {
    Serial.begin(115200);
    
    // Initialize DHT sensor
    dht.begin();
    
    // Initialize LoRa
    LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
    if (!LoRa.begin(915E6)) {
      Serial.println("LoRa initialization failed!");
      while (1);
    }
    
    // Initialize GPS
    gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);
    
    // Generate unique device ID
    deviceId = "AGRO_" + WiFi.macAddress();
    deviceId.replace(":", "");
    
    Serial.println("AgroChain Sensor Node initialized");
    Serial.println("Device ID: " + deviceId);
  }
  
  void loop() {
    unsigned long currentTime = millis();
    
    if (currentTime - lastTransmission >= TRANSMISSION_INTERVAL) {
      SensorData data = collectSensorData();
      transmitData(data);
      lastTransmission = currentTime;
    }
    
    // Handle incoming messages
    handleIncomingMessages();
    
    delay(1000);
  }
  
private:
  SensorData collectSensorData() {
    SensorData data;
    
    // Read temperature and humidity
    data.temperature = dht.readTemperature();
    data.humidity = dht.readHumidity();
    
    // Read GPS location
    data.latitude = readGPSLatitude();
    data.longitude = readGPSLongitude();
    
    // Get battery level
    data.batteryLevel = analogRead(A0) * (100.0 / 4096.0);
    
    // Set metadata
    data.timestamp = millis();
    data.deviceId = deviceId;
    
    Serial.printf("Temperature: %.2f°C, Humidity: %.2f%%\n", 
                  data.temperature, data.humidity);
    Serial.printf("Location: %.6f, %.6f\n", data.latitude, data.longitude);
    Serial.printf("Battery: %.2f%%\n", data.batteryLevel);
    
    return data;
  }
  
  void transmitData(SensorData data) {
    // Create JSON payload
    DynamicJsonDocument doc(1024);
    doc["deviceId"] = data.deviceId;
    doc["temperature"] = data.temperature;
    doc["humidity"] = data.humidity;
    doc["latitude"] = data.latitude;
    doc["longitude"] = data.longitude;
    doc["timestamp"] = data.timestamp;
    doc["batteryLevel"] = data.batteryLevel;
    
    String payload;
    serializeJson(doc, payload);
    
    // Transmit via LoRa
    LoRa.beginPacket();
    LoRa.print(payload);
    LoRa.endPacket();
    
    Serial.println("Data transmitted via LoRa");
  }
  
  void handleIncomingMessages() {
    int packetSize = LoRa.parsePacket();
    if (packetSize) {
      String message = "";
      while (LoRa.available()) {
        message += (char)LoRa.read();
      }
      
      Serial.println("Received: " + message);
      processMessage(message);
    }
  }
  
  void processMessage(String message) {
    DynamicJsonDocument doc(256);
    deserializeJson(doc, message);
    
    String command = doc["command"];
    
    if (command == "config") {
      // Update configuration
      if (doc.containsKey("interval")) {
        TRANSMISSION_INTERVAL = doc["interval"];
        Serial.println("Transmission interval updated");
      }
    } else if (command == "ping") {
      // Respond with ping
      DynamicJsonDocument response(128);
      response["deviceId"] = deviceId;
      response["status"] = "alive";
      
      String responseStr;
      serializeJson(response, responseStr);
      
      LoRa.beginPacket();
      LoRa.print(responseStr);
      LoRa.endPacket();
    }
  }
  
  float readGPSLatitude() {
    // Simplified GPS reading
    // In production, this would parse NMEA sentences
    return 40.7128 + (random(-1000, 1000) / 100000.0);
  }
  
  float readGPSLongitude() {
    // Simplified GPS reading
    return -74.0060 + (random(-1000, 1000) / 100000.0);
  }
};

AgroChainSensorNode sensorNode;

void setup() {
  sensorNode.setup();
}

void loop() {
  sensorNode.loop();
}
```

### 5.2 Gateway Software (Raspberry Pi)
```python
# iot/gateway-software/gateway.py
import json
import time
import asyncio
import aiohttp
from datetime import datetime
from typing import Dict, List, Optional
import serial
import serial.tools.list_ports
from dataclasses import dataclass
from sqlalchemy import create_engine, Column, String, Float, DateTime, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

@dataclass
class SensorReading:
    device_id: str
    temperature: float
    humidity: float
    latitude: float
    longitude: float
    timestamp: int
    battery_level: float

class SensorData(Base):
    __tablename__ = 'sensor_data'
    
    id = Column(String, primary_key=True)
    device_id = Column(String)
    temperature = Column(Float)
    humidity = Column(Float)
    latitude = Column(Float)
    longitude = Column(Float)
    timestamp = Column(DateTime)
    battery_level = Column(Float)
    processed = Column(Integer, default=0)

class AgroChainGateway:
    def __init__(self, config_file: str = 'config.json'):
        self.config = self.load_config(config_file)
        self.setup_database()
        self.setup_lora()
        self.session = aiohttp.ClientSession()
        self.api_base_url = self.config['api']['base_url']
        
    def load_config(self, config_file: str) -> Dict:
        with open(config_file, 'r') as f:
            return json.load(f)
    
    def setup_database(self):
        engine = create_engine(self.config['database']['url'])
        Base.metadata.create_all(engine)
        self.Session = sessionmaker(bind=engine)
    
    def setup_lora(self):
        ports = serial.tools.list_ports.comports()
        lora_port = None
        
        for port in ports:
            if 'USB' in port.description or 'UART' in port.description:
                lora_port = port.device
                break
        
        if not lora_port:
            raise Exception("LoRa device not found")
        
        self.lora_serial = serial.Serial(
            port=lora_port,
            baudrate=9600,
            timeout=1
        )
        
        print(f"LoRa connected on {lora_port}")
    
    async def start(self):
        print("AgroChain Gateway starting...")
        
        # Start background tasks
        tasks = [
            asyncio.create_task(self.listen_lora()),
            asyncio.create_task(self.process_data()),
            asyncio.create_task(self.health_check()),
            asyncio.create_task(self.send_heartbeat()),
        ]
        
        await asyncio.gather(*tasks)
    
    async def listen_lora(self):
        while True:
            if self.lora_serial.in_waiting > 0:
                try:
                    message = self.lora_serial.readline().decode('utf-8').strip()
                    if message:
                        await self.handle_lora_message(message)
                except Exception as e:
                    print(f"Error reading LoRa: {e}")
            
            await asyncio.sleep(0.1)
    
    async def handle_lora_message(self, message: str):
        try:
            data = json.loads(message)
            
            if 'deviceId' in data and 'temperature' in data:
                # Sensor data message
                reading = SensorReading(
                    device_id=data['deviceId'],
                    temperature=data['temperature'],
                    humidity=data['humidity'],
                    latitude=data['latitude'],
                    longitude=data['longitude'],
                    timestamp=data['timestamp'],
                    battery_level=data['batteryLevel']
                )
                
                await self.store_sensor_data(reading)
                await self.check_anomalies(reading)
                
            elif 'command' in data:
                # Command message
                await self.handle_command(data)
                
        except json.JSONDecodeError as e:
            print(f"Invalid JSON: {e}")
        except Exception as e:
            print(f"Error handling message: {e}")
    
    async def store_sensor_data(self, reading: SensorReading):
        session = self.Session()
        try:
            sensor_data = SensorData(
                id=f"{reading.device_id}_{reading.timestamp}",
                device_id=reading.device_id,
                temperature=reading.temperature,
                humidity=reading.humidity,
                latitude=reading.latitude,
                longitude=reading.longitude,
                timestamp=datetime.fromtimestamp(reading.timestamp / 1000),
                battery_level=reading.battery_level
            )
            
            session.add(sensor_data)
            session.commit()
            
            print(f"Stored data from {reading.device_id}")
            
        finally:
            session.close()
    
    async def check_anomalies(self, reading: SensorReading):
        anomalies = []
        
        # Temperature anomaly
        if reading.temperature < 2 or reading.temperature > 8:
            anomalies.append({
                'type': 'temperature',
                'severity': 'high' if reading.temperature < 0 or reading.temperature > 10 else 'medium',
                'value': reading.temperature,
                'threshold': '2-8°C'
            })
        
        # Humidity anomaly
        if reading.humidity > 90:
            anomalies.append({
                'type': 'humidity',
                'severity': 'medium',
                'value': reading.humidity,
                'threshold': '90%'
            })
        
        # Battery anomaly
        if reading.battery_level < 20:
            anomalies.append({
                'type': 'battery',
                'severity': 'high',
                'value': reading.battery_level,
                'threshold': '20%'
            })
        
        if anomalies:
            await self.send_alert(reading.device_id, anomalies)
    
    async def send_alert(self, device_id: str, anomalies: List[Dict]):
        alert_data = {
            'deviceId': device_id,
            'anomalies': anomalies,
            'timestamp': datetime.utcnow().isoformat(),
            'location': await self.get_device_location(device_id)
        }
        
        try:
            async with self.session.post(
                f"{self.api_base_url}/api/alerts",
                json=alert_data,
                headers={'Authorization': f"Bearer {self.config['api']['token']}"}
            ) as response:
                if response.status == 200:
                    print(f"Alert sent for device {device_id}")
                else:
                    print(f"Failed to send alert: {response.status}")
                    
        except Exception as e:
            print(f"Error sending alert: {e}")
    
    async def process_data(self):
        while True:
            await asyncio.sleep(30)  # Process every 30 seconds
            
            session = self.Session()
            try:
                # Get unprocessed data
                unprocessed = session.query(SensorData).filter(
                    SensorData.processed == 0
                ).limit(100).all()
                
                for data in unprocessed:
                    await self.forward_to_api(data)
                    data.processed = 1
                
                session.commit()
                
            except Exception as e:
                print(f"Error processing data: {e}")
                session.rollback()
            finally:
                session.close()
    
    async def forward_to_api(self, data: SensorData):
        payload = {
            'deviceId': data.device_id,
            'temperature': data.temperature,
            'humidity': data.humidity,
            'latitude': data.latitude,
            'longitude': data.longitude,
            'timestamp': data.timestamp.isoformat(),
            'batteryLevel': data.battery_level
        }
        
        try:
            async with self.session.post(
                f"{self.api_base_url}/api/iot/data",
                json=payload,
                headers={'Authorization': f"Bearer {self.config['api']['token']}"}
            ) as response:
                if response.status == 200:
                    print(f"Data forwarded for device {data.device_id}")
                else:
                    print(f"Failed to forward data: {response.status}")
                    
        except Exception as e:
            print(f"Error forwarding data: {e}")
    
    async def health_check(self):
        while True:
            await asyncio.sleep(300)  # Every 5 minutes
            
            # Check LoRa connection
            if not self.lora_serial.is_open:
                try:
                    self.lora_serial.open()
                    print("LoRa connection restored")
                except:
                    print("Failed to restore LoRa connection")
            
            # Check database connection
            try:
                session = self.Session()
                session.execute("SELECT 1")
                session.close()
            except:
                print("Database connection issue")
    
    async def send_heartbeat(self):
        while True:
            await asyncio.sleep(60)  # Every minute
            
            heartbeat = {
                'gatewayId': self.config['gateway']['id'],
                'status': 'active',
                'timestamp': datetime.utcnow().isoformat(),
                'connectedDevices': await self.get_connected_devices_count()
            }
            
            try:
                async with self.session.post(
                    f"{self.api_base_url}/api/gateways/heartbeat",
                    json=heartbeat,
                    headers={'Authorization': f"Bearer {self.config['api']['token']}"}
                ) as response:
                    if response.status != 200:
                        print(f"Heartbeat failed: {response.status}")
                        
            except Exception as e:
                print(f"Heartbeat error: {e}")
    
    async def get_device_location(self, device_id: str) -> Optional[Dict]:
        session = self.Session()
        try:
            latest = session.query(SensorData).filter(
                SensorData.device_id == device_id
            ).order_by(SensorData.timestamp.desc()).first()
            
            if latest:
                return {
                    'latitude': latest.latitude,
                    'longitude': latest.longitude
                }
            return None
            
        finally:
            session.close()
    
    async def get_connected_devices_count(self) -> int:
        session = self.Session()
        try:
            # Count devices that sent data in the last 5 minutes
            five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
            
            count = session.query(SensorData.device_id).filter(
                SensorData.timestamp >= five_minutes_ago
            ).distinct().count()
            
            return count
            
        finally:
            session.close()
    
    async def handle_command(self, command_data: Dict):
        device_id = command_data.get('deviceId')
        command = command_data.get('command')
        
        if command == 'ping':
            # Send ping response
            response = {
                'command': 'pong',
                'gatewayId': self.config['gateway']['id'],
                'timestamp': datetime.utcnow().isoformat()
            }
            
            message = json.dumps(response) + '\n'
            self.lora_serial.write(message.encode())
            
        elif command == 'config':
            # Forward configuration to device
            device_id = command_data.get('targetDevice')
            if device_id:
                # Send configuration via LoRa
                config = command_data.get('config', {})
                response = {
                    'command': 'config',
                    'config': config,
                    'gatewayId': self.config['gateway']['id']
                }
                
                message = json.dumps(response) + '\n'
                self.lora_serial.write(message.encode())

if __name__ == "__main__":
    gateway = AgroChainGateway()
    asyncio.run(gateway.start())
```

## 6. Deployment and Infrastructure

### 6.1 Docker Configuration
```dockerfile
# infrastructure/docker/Dockerfile.api
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]

# infrastructure/docker/Dockerfile.gateway
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Install serial port dependencies
RUN apt-get update && apt-get install -y \
    python3-serial \
    && rm -rf /var/lib/apt/lists/*

CMD ["python", "gateway.py"]
```

### 6.2 Kubernetes Deployment
```yaml
# infrastructure/kubernetes/agrochain-namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: agrochain

---
# infrastructure/kubernetes/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agrochain-api
  namespace: agrochain
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agrochain-api
  template:
    metadata:
      labels:
        app: agrochain-api
    spec:
      containers:
      - name: api
        image: agrochain/api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: agrochain-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: agrochain-secrets
              key: jwt-secret
        - name: STELLAR_NETWORK
          value: "testnet"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
# infrastructure/kubernetes/api-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: agrochain-api-service
  namespace: agrochain
spec:
  selector:
    app: agrochain-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 6.3 Monitoring and Logging
```yaml
# infrastructure/monitoring/prometheus-config.yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'agrochain-api'
    static_configs:
      - targets: ['agrochain-api-service:80']
    metrics_path: '/metrics'
    
  - job_name: 'agrochain-gateway'
    static_configs:
      - targets: ['gateway-1:9100', 'gateway-2:9100']
    
  - job_name: 'stellar-node'
    static_configs:
      - targets: ['stellar-node:11626']

---
# infrastructure/monitoring/grafana-dashboard.json
{
  "dashboard": {
    "title": "AgroChain Monitoring",
    "panels": [
      {
        "title": "API Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "IoT Device Status",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(connected_devices)",
            "legendFormat": "Connected Devices"
          }
        ]
      },
      {
        "title": "Blockchain Transactions",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(stellar_transactions_total[5m])",
            "legendFormat": "Transactions/sec"
          }
        ]
      }
    ]
  }
}
```

## 7. Testing Strategy

### 7.1 Unit Tests
```javascript
// tests/unit/contracts.test.js
const { expect } = require('chai');
const { Contract } = require('@stellar/stellar-sdk');

describe('ProductRegistry Contract', () => {
    let contract;
    let env;
    
    beforeEach(() => {
        env = new Env();
        contract = new Contract(env);
    });
    
    it('should register a new product', async () => {
        const farmer = Address.generate();
        const productData = {
            name: 'Test Product',
            category: 'vegetables',
            origin: { latitude: 40.7128, longitude: -74.0060 },
            metadata: { test: 'data' }
        };
        
        const result = await contract.register_product(farmer, productData);
        
        expect(result.success).to.be.true;
        expect(result.productId).to.exist;
    });
    
    it('should reject unauthorized product registration', async () => {
        const unauthorizedUser = Address.generate();
        const productData = {
            name: 'Test Product',
            category: 'vegetables',
            origin: { latitude: 40.7128, longitude: -74.0060 },
            metadata: { test: 'data' }
        };
        
        try {
            await contract.register_product(unauthorizedUser, productData);
            expect.fail('Should have thrown an error');
        } catch (error) {
            expect(error.message).to.include('Unauthorized');
        }
    });
});
```

### 7.2 Integration Tests
```javascript
// tests/integration/supply-chain.test.js
const { expect } = require('chai');
const AgroChainSDK = require('../src/sdk');

describe('Supply Chain Integration', () => {
    let sdk;
    let farmer, processor, distributor;
    let productId, shipmentId;
    
    before(async () => {
        sdk = new AgroChainSDK({
            network: 'testnet',
            apiUrl: 'http://localhost:3000'
        });
        
        // Create test accounts
        farmer = await sdk.createAccount('farmer');
        processor = await sdk.createAccount('processor');
        distributor = await sdk.createAccount('distributor');
    });
    
    it('should complete full supply chain flow', async () => {
        // 1. Register product
        const product = await sdk.products.register({
            name: 'Organic Tomatoes',
            category: 'vegetables',
            origin: {
                latitude: 40.7128,
                longitude: -74.0060,
                address: '123 Farm Road',
                country: 'USA'
            },
            farmer: farmer.address
        });
        productId = product.id;
        
        // 2. Create shipment
        const shipment = await sdk.shipments.create({
            productIds: [productId],
            from: farmer.address,
            to: processor.address,
            carrier: distributor.address
        });
        shipmentId = shipment.id;
        
        // 3. Update shipment status
        await sdk.shipments.updateStatus(shipmentId, 'picked_up', distributor.address);
        
        // 4. Submit quality report
        await sdk.quality.submitReport({
            productId,
            inspector: processor.address,
            metrics: {
                appearance: 90,
                freshness: 85,
                size: 88
            }
        });
        
        // 5. Create payment
        const payment = await sdk.payments.create({
            from: processor.address,
            to: farmer.address,
            amount: 1000,
            productId
        });
        
        // 6. Release payment
        await sdk.payments.release(payment.id, processor.address);
        
        // Verify final state
        const finalProduct = await sdk.products.get(productId);
        expect(finalProduct.currentStatus).to.equal('processing');
        
        const finalShipment = await sdk.shipments.get(shipmentId);
        expect(finalShipment.status).to.equal('delivered');
    });
});
```

### 7.3 Load Testing
```javascript
// tests/load/api-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export let options = {
    stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],
        errors: ['rate<0.1'],
    },
};

export default function() {
    const response = http.post('http://localhost:3000/api/products', {
        name: `Load Test Product ${Math.random()}`,
        category: 'vegetables',
        origin: {
            latitude: 40.7128,
            longitude: -74.0060,
            address: 'Test Address',
            country: 'USA'
        }
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
        }
    });
    
    const success = check(response, {
        'status is 201': (r) => r.status === 201,
        'response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    errorRate.add(!success);
    
    sleep(1);
}
```

## 8. Conclusion

This technical implementation guide provides a comprehensive foundation for building the AgroChain decentralized agricultural supply chain system. The implementation leverages:

- **Stellar Blockchain**: Low-cost, fast transactions with Soroban smart contracts
- **Microservices Architecture**: Scalable and maintainable backend services
- **Modern Frontend**: React-based applications with real-time updates
- **IoT Integration**: Real-time sensor data collection and processing
- **Robust Infrastructure**: Docker, Kubernetes, and comprehensive monitoring

The system is designed to be:
- **Scalable**: Handle thousands of concurrent users and IoT devices
- **Secure**: Multi-layer security with blockchain immutability
- **User-Friendly**: Intuitive interfaces for all stakeholder types
- **Compliant**: Built-in regulatory compliance features
- **Cost-Effective**: Leverages Stellar's low transaction costs

This implementation provides a solid foundation for transforming agricultural supply chains with blockchain technology.
