/**
 * Blockchain Cache Invalidation Service
 * Listens for blockchain events and invalidates Redis cache accordingly
 */

import { redisCacheService } from './redisCache';
import { logger } from '@/utils/logger';

// Blockchain event types that should trigger cache invalidation
export type BlockchainEventType = 
  | 'PropertyCreated'
  | 'PropertyUpdated'
  | 'PropertySold'
  | 'PropertyListed'
  | 'PropertyDelisted'
  | 'OwnershipTransferred'
  | 'PriceUpdated'
  | 'MetadataUpdated';

interface BlockchainEvent {
  type: BlockchainEventType;
  propertyId?: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  data?: any;
}

/**
 * Blockchain Cache Invalidator class
 */
class BlockchainCacheInvalidator {
  private isListening = false;
  private eventQueue: BlockchainEvent[] = [];
  private processingInterval: NodeJS.Timeout | null = null;

  /**
   * Start listening for blockchain events
   */
  async start(): Promise<void> {
    if (this.isListening) {
      logger.warn('Blockchain cache invalidator is already running');
      return;
    }

    try {
      // Initialize Redis connection
      await redisCacheService.healthCheck();
      
      // Start processing queue
      this.startQueueProcessor();
      
      // Set up blockchain event listeners
      await this.setupBlockchainListeners();
      
      this.isListening = true;
      logger.info('Blockchain cache invalidator started');
    } catch (error) {
      logger.error('Failed to start blockchain cache invalidator:', error);
      throw error;
    }
  }

  /**
   * Stop listening for blockchain events
   */
  async stop(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    this.isListening = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    logger.info('Blockchain cache invalidator stopped');
  }

  /**
   * Set up blockchain event listeners
   * This would integrate with your actual blockchain provider (ethers.js, web3.js, etc.)
   */
  private async setupBlockchainListeners(): Promise<void> {
    try {
      // Example implementation with ethers.js
      // You would need to adapt this to your actual blockchain integration
      
      /*
      const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
      const contract = new ethers.Contract(
        process.env.PROPERTY_CONTRACT_ADDRESS!,
        PROPERTY_CONTRACT_ABI,
        provider
      );

      // Listen for property creation events
      contract.on('PropertyCreated', (propertyId, event) => {
        this.queueEvent({
          type: 'PropertyCreated',
          propertyId,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: Date.now(),
        });
      });

      // Listen for property update events
      contract.on('PropertyUpdated', (propertyId, event) => {
        this.queueEvent({
          type: 'PropertyUpdated',
          propertyId,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: Date.now(),
        });
      });

      // Listen for property sale events
      contract.on('PropertySold', (propertyId, event) => {
        this.queueEvent({
          type: 'PropertySold',
          propertyId,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: Date.now(),
        });
      });

      // Listen for property listing events
      contract.on('PropertyListed', (propertyId, event) => {
        this.queueEvent({
          type: 'PropertyListed',
          propertyId,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: Date.now(),
        });
      });

      // Listen for property delisting events
      contract.on('PropertyDelisted', (propertyId, event) => {
        this.queueEvent({
          type: 'PropertyDelisted',
          propertyId,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: Date.now(),
        });
      });

      // Listen for ownership transfer events
      contract.on('OwnershipTransferred', (propertyId, event) => {
        this.queueEvent({
          type: 'OwnershipTransferred',
          propertyId,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: Date.now(),
        });
      });

      // Listen for price update events
      contract.on('PriceUpdated', (propertyId, event) => {
        this.queueEvent({
          type: 'PriceUpdated',
          propertyId,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: Date.now(),
        });
      });

      // Listen for metadata update events
      contract.on('MetadataUpdated', (propertyId, event) => {
        this.queueEvent({
          type: 'MetadataUpdated',
          propertyId,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: Date.now(),
        });
      });
      */

      logger.info('Blockchain event listeners set up');
    } catch (error) {
      logger.error('Failed to set up blockchain listeners:', error);
      throw error;
    }
  }

  /**
   * Queue a blockchain event for processing
   */
  private queueEvent(event: BlockchainEvent): void {
    this.eventQueue.push(event);
    logger.debug(`Queued blockchain event: ${event.type} for property: ${event.propertyId}`);
  }

  /**
   * Start the queue processor
   */
  private startQueueProcessor(): void {
    this.processingInterval = setInterval(async () => {
      await this.processEventQueue();
    }, 1000); // Process every second
  }

  /**
   * Process the event queue
   */
  private async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const eventsToProcess = this.eventQueue.splice(0, 10); // Process up to 10 events at a time
    
    for (const event of eventsToProcess) {
      try {
        await this.processEvent(event);
      } catch (error) {
        logger.error(`Failed to process blockchain event ${event.type}:`, error);
        // Re-queue failed events for retry
        this.eventQueue.unshift(event);
        break; // Stop processing on first error to avoid infinite loops
      }
    }
  }

  /**
   * Process a single blockchain event
   */
  private async processEvent(event: BlockchainEvent): Promise<void> {
    logger.debug(`Processing blockchain event: ${event.type}`);

    switch (event.type) {
      case 'PropertyCreated':
      case 'PropertyUpdated':
      case 'PropertySold':
      case 'PropertyListed':
      case 'PropertyDelisted':
      case 'OwnershipTransferred':
      case 'PriceUpdated':
      case 'MetadataUpdated':
        if (event.propertyId) {
          // Invalidate specific property cache
          await redisCacheService.invalidateProperty(event.propertyId);
          logger.info(`Invalidated cache for property ${event.propertyId} due to ${event.type}`);
        }
        break;

      default:
        logger.warn(`Unknown blockchain event type: ${event.type}`);
        return;
    }

    // For events that affect listings, also invalidate listing cache
    if (['PropertyCreated', 'PropertyUpdated', 'PropertySold', 'PropertyListed', 'PropertyDelisted'].includes(event.type)) {
      await redisCacheService.invalidatePattern('listing:*');
      await redisCacheService.invalidatePattern('search:*');
      logger.info(`Invalidated listing and search cache due to ${event.type}`);
    }
  }

  /**
   * Manually trigger cache invalidation for a property
   */
  async invalidateProperty(propertyId: string, reason: string = 'Manual'): Promise<void> {
    await redisCacheService.invalidateProperty(propertyId);
    logger.info(`Manually invalidated cache for property ${propertyId} (${reason})`);
  }

  /**
   * Manually trigger cache invalidation for all properties
   */
  async invalidateAllProperties(reason: string = 'Manual'): Promise<void> {
    await redisCacheService.invalidateAllProperties();
    logger.info(`Manually invalidated all property cache (${reason})`);
  }

  /**
   * Get invalidation statistics
   */
  async getStats(): Promise<{
    isListening: boolean;
    queueLength: number;
    lastProcessed?: number;
  }> {
    return {
      isListening: this.isListening,
      queueLength: this.eventQueue.length,
    };
  }

  /**
   * Simulate a blockchain event (for testing)
   */
  async simulateEvent(event: BlockchainEvent): Promise<void> {
    logger.info(`Simulating blockchain event: ${event.type}`);
    await this.processEvent(event);
  }
}

// Export singleton instance
export const blockchainCacheInvalidator = new BlockchainCacheInvalidator();

export default blockchainCacheInvalidator;
