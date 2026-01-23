// 'use client';

// import { motion } from "framer-motion";
// import { Bell, Search, Wallet, ChevronDown, Menu } from "lucide-react";

// interface HeaderProps {
//   onMenuToggle?: () => void;
// }

// export const Header = ({ onMenuToggle }: HeaderProps) => {
//   return (
//     <motion.header
//       initial={{ opacity: 0, y: -20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5 }}
//       className="sticky top-0 z-50 glass-card border-b border-border/50 px-4 md:px-6 py-4"
//     >
//       <div className="flex items-center justify-between gap-4">
//         {/* Left section */}
//         <div className="flex items-center gap-4">
//           <button
//             onClick={onMenuToggle}
//             className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
//           >
//             <Menu className="w-5 h-5" />
//           </button>
          
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
//               <span className="text-lg font-bold text-primary-foreground">M</span>
//             </div>
//             <div className="hidden sm:block">
//               <h1 className="text-xl font-bold gradient-text">MettaChain</h1>
//               <p className="text-xs text-muted-foreground">PropChain Analytics</p>
//             </div>
//           </div>
//         </div>

//         {/* Search bar - hidden on mobile */}
//         <div className="hidden md:flex flex-1 max-w-md mx-8">
//           <div className="relative w-full">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//             <input
//               type="text"
//               placeholder="Search properties, transactions..."
//               className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
//             />
//           </div>
//         </div>

//         {/* Right section */}
//         <div className="flex items-center gap-2 md:gap-4">
//           <button className="p-2.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors relative">
//             <Bell className="w-5 h-5" />
//             <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
//           </button>

//           <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary border border-border">
//             <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
//               <Wallet className="w-4 h-4 text-primary-foreground" />
//             </div>
//             <div className="text-right">
//               <p className="text-xs text-muted-foreground">Connected</p>
//               <p className="text-sm font-mono font-medium">0x7a3...8f2d</p>
//             </div>
//             <ChevronDown className="w-4 h-4 text-muted-foreground" />
//           </div>

//           <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
//             <span className="text-sm font-semibold text-primary-foreground">JD</span>
//           </div>
//         </div>
//       </div>
//     </motion.header>
//   );
// };
