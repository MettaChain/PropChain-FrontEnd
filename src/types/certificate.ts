export interface NFTCertificate {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  propertyImage: string;
  tokenAmount: number;
  tokenSymbol: string;
  walletAddress: string;
  purchaseDate: string;
  transactionHash: string;
  network: string;
  contractAddress: string;
  ownershipPercentage: number;
}

export interface CertificateState {
  certificates: NFTCertificate[];
  addCertificate: (cert: NFTCertificate) => void;
  getCertificate: (propertyId: string, walletAddress: string) => NFTCertificate | undefined;
}
