// 'use client';

// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   LayoutDashboard, 
//   Building2, 
//   BarChart3, 
//   Wallet, 
//   FileText, 
//   Settings, 
//   HelpCircle,
//   ChevronLeft,
//   X
// } from "lucide-react";

// interface SidebarProps {
//   isOpen: boolean;
//   onClose: () => void;
//   activeItem?: string;
//   onItemClick?: (item: string) => void;
// }

// const menuItems = [
//   { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
//   { id: "properties", label: "Properties", icon: Building2 },
//   { id: "analytics", label: "Analytics", icon: BarChart3 },
//   { id: "wallet", label: "Wallet", icon: Wallet },
//   { id: "reports", label: "Reports", icon: FileText },
// ];

// const bottomItems = [
//   { id: "settings", label: "Settings", icon: Settings },
//   { id: "help", label: "Help & Support", icon: HelpCircle },
// ];

// export const Sidebar = ({ isOpen, onClose, activeItem = "dashboard", onItemClick }: SidebarProps) => {
//   const SidebarContent = () => (
//     <div className="flex flex-col h-full">
//       {/* Logo section for mobile */}
//       <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
//             <span className="text-lg font-bold text-primary-foreground">M</span>
//           </div>
//           <div>
//             <h1 className="text-lg font-bold gradient-text">MettaChain</h1>
//           </div>
//         </div>
//         <button
//           onClick={onClose}
//           className="p-2 text-muted-foreground hover:text-foreground transition-colors"
//         >
//           <X className="w-5 h-5" />
//         </button>
//       </div>

//       {/* Navigation */}
//       <nav className="flex-1 p-4 space-y-1">
//         <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 px-3">
//           Main Menu
//         </p>
//         {menuItems.map((item) => (
//           <button
//             key={item.id}
//             onClick={() => onItemClick?.(item.id)}
//             className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
//               activeItem === item.id
//                 ? "bg-primary/10 text-primary border border-primary/20"
//                 : "text-muted-foreground hover:text-foreground hover:bg-secondary"
//             }`}
//           >
//             <item.icon className="w-5 h-5" />
//             {item.label}
//             {activeItem === item.id && (
//               <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
//             )}
//           </button>
//         ))}
//       </nav>

//       {/* Bottom section */}
//       <div className="p-4 border-t border-border space-y-1">
//         {bottomItems.map((item) => (
//           <button
//             key={item.id}
//             onClick={() => onItemClick?.(item.id)}
//             className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
//           >
//             <item.icon className="w-5 h-5" />
//             {item.label}
//           </button>
//         ))}
//       </div>

//       {/* Upgrade card */}
//       <div className="p-4">
//         <div className="bg-gradient-primary rounded-xl p-4 text-primary-foreground">
//           <p className="font-semibold text-sm">Upgrade to Pro</p>
//           <p className="text-xs mt-1 opacity-90">Unlock advanced analytics and premium features</p>
//           <button className="mt-3 w-full bg-background/20 hover:bg-background/30 rounded-lg py-2 text-xs font-medium transition-colors">
//             Upgrade Now
//           </button>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <>
//       {/* Desktop sidebar */}
//       <aside className="hidden lg:block w-64 border-r border-border bg-card h-screen sticky top-0 shrink-0">
//         <SidebarContent />
//       </aside>

//       {/* Mobile sidebar overlay */}
//       <AnimatePresence>
//         {isOpen && (
//           <>
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               onClick={onClose}
//               className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
//             />
//             <motion.aside
//               initial={{ x: -280 }}
//               animate={{ x: 0 }}
//               exit={{ x: -280 }}
//               transition={{ type: "spring", damping: 25, stiffness: 200 }}
//               className="lg:hidden fixed left-0 top-0 w-[280px] h-screen bg-card border-r border-border z-50"
//             >
//               <SidebarContent />
//             </motion.aside>
//           </>
//         )}
//       </AnimatePresence>
//     </>
//   );
// };
