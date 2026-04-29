import { http, HttpResponse } from 'msw';
import { MOCK_PROPERTIES } from '@/lib/mockData';
import type { Property, PropertySearchResult } from '@/types/property';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const handlers = [
  // Get all properties / search properties
  http.get(`${BASE_URL}/api/properties`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '12');
    const query = url.searchParams.get('query') || '';
    const minPrice = parseInt(url.searchParams.get('minPrice') || '0');
    const maxPrice = parseInt(url.searchParams.get('maxPrice') || '100000000');

    let filtered = [...MOCK_PROPERTIES];

    // Apply search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.location.city.toLowerCase().includes(lowerQuery) ||
        p.location.state.toLowerCase().includes(lowerQuery)
      );
    }

    // Apply price filter
    filtered = filtered.filter(p => p.price.total >= minPrice && p.price.total <= maxPrice);

    // Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedResults = filtered.slice(startIndex, startIndex + limit);

    const result: PropertySearchResult = {
      properties: paginatedResults,
      total,
      page,
      totalPages,
    };

    return HttpResponse.json(result);
  }),

  // Get property by ID
  http.get(`${BASE_URL}/api/properties/:id`, ({ params }) => {
    const { id } = params;
    const property = MOCK_PROPERTIES.find(p => p.id === id);

    if (!property) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(property);
  }),

  // Purchase tokens
  http.post(`${BASE_URL}/api/properties/:id/purchase`, async ({ request, params }) => {
    const { id } = params;
    const body = await request.json() as { amount: number; walletAddress: string };

    const property = MOCK_PROPERTIES.find(p => p.id === id);

    if (!property) {
      return HttpResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    if (body.amount <= 0) {
      return HttpResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (body.amount > property.tokenInfo.available) {
      return HttpResponse.json(
        { error: 'Insufficient tokens available' },
        { status: 400 }
      );
    }

    // Simulate successful purchase
    return HttpResponse.json({
      success: true,
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      amount: body.amount,
      totalCost: body.amount * property.price.perToken,
      property: {
        id: property.id,
        name: property.name,
      },
    });
  }),

  // Get transaction history
  http.get(`${BASE_URL}/api/transactions`, ({ request }) => {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');

    if (!walletAddress) {
      return HttpResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Mock transaction history
    const transactions = [
      {
        id: 'tx-1',
        type: 'purchase',
        propertyId: '1',
        propertyName: 'Luxury Downtown Penthouse',
        amount: 10,
        totalCost: 1000,
        transactionHash: '0xabc123',
        timestamp: new Date().toISOString(),
        status: 'completed',
      },
      {
        id: 'tx-2',
        type: 'purchase',
        propertyId: '2',
        propertyName: 'Modern Office Complex',
        amount: 5,
        totalCost: 1000,
        transactionHash: '0xdef456',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed',
      },
    ];

    return HttpResponse.json(transactions);
  }),

  // Get user balance
  http.get(`${BASE_URL}/api/wallet/balance`, ({ request }) => {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('walletAddress');

    if (!walletAddress) {
      return HttpResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      balance: '100.0',
      currency: 'ETH',
    });
  }),

  // Validate purchase
  http.post(`${BASE_URL}/api/properties/:id/validate`, async ({ request, params }) => {
    const { id } = params;
    const body = await request.json() as { amount: number; walletAddress: string };

    const property = MOCK_PROPERTIES.find(p => p.id === id);

    if (!property) {
      return HttpResponse.json(
        { valid: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    if (body.amount <= 0) {
      return HttpResponse.json({
        valid: false,
        error: 'Amount must be greater than 0',
      });
    }

    if (body.amount > property.tokenInfo.available) {
      return HttpResponse.json({
        valid: false,
        error: 'Insufficient tokens available',
      });
    }

    return HttpResponse.json({
      valid: true,
      totalCost: body.amount * property.price.perToken,
    });
  }),
];
