/**
 * UI Layer - Reusable UI components (buttons, inputs, modals, etc.)
 *
 * This layer contains generic, presentation-only components that have
 * no business logic and can be used anywhere in the application.
 */

// Primitives
export { Button } from '@/components/ui/button';
export { Input } from '@/components/ui/input';
export { Textarea } from '@/components/ui/textarea';
export { Badge } from '@/components/ui/badge';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
export { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
export { Label } from '@/components/ui/label';
export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
export { Checkbox } from '@/components/ui/checkbox';
export { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
export { Switch } from '@/components/ui/switch';
export { Slider } from '@/components/ui/slider';
export { Progress } from '@/components/ui/progress';
export { Skeleton } from '@/components/ui/skeleton';
export { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
export { Separator } from '@/components/ui/separator';
export { ScrollArea } from '@/components/ui/scroll-area';
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
export { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
export { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
export { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
export { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
export { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuContent, NavigationMenuTrigger, NavigationMenuLink } from '@/components/ui/navigation-menu';

// Custom UI components
export { LoadingState, LoadingSpinner } from '@/components/LoadingSpinner';
export { ErrorBoundaryPresets } from '@/components/error/EnhancedErrorBoundary';
export { PageTransition } from '@/components/PageTransition';
export { Dropdown } from '@/components/ui/Dropdown';
export { CharacterCounter, CharacterCounterInput, CharacterCounterTextarea } from '@/components/ui/CharacterCounter';
export { FileUpload } from '@/components/ui/FileUpload';
export { LazyLoader } from '@/components/ui/LazyLoader';
export { SimpleErrorBoundary } from '@/components/ui/SimpleErrorBoundary';
export { UserProfileDropdown } from '@/components/ui/UserProfileDropdown';
export { StatusIndicator, StatusBadge } from '@/components/ui/StatusIndicator';
export { PasswordInput } from '@/components/ui/PasswordInput';
export { NotificationBadge } from '@/components/ui/NotificationBadge';
export { StickyTable } from '@/components/ui/StickyTable';
export { AutoSaveIndicator, useAutoSave } from '@/components/ui/AutoSaveIndicator';
export { ReusableAccordion, ReusableAccordionItem } from '@/components/ui/ReusableAccordion';
export { ReusableTabs, ReusableTabsList, ReusableTabsTrigger, ReusableTabsContent } from '@/components/ui/ReusableTabs';
export { MobileForm, MobileFormField, MobileFormSubmit } from '@/components/ui/MobileForm';
