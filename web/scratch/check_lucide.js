const lucide = require('lucide-react');
const icons = ['ShieldCheck', 'ShieldAlert', 'Users', 'PackageOpen', 'ClipboardList', 'Wallet', 'RefreshCcw', 'UserPlus', 'Trash', 'Image', 'LayoutGrid', 'Settings', 'Plus', 'Eye', 'EyeOff', 'Save', 'Ticket'];
let ok = true;
for (const icon of icons) {
  if (!lucide[icon]) {
    console.error(`Missing icon: ${icon}`);
    ok = false;
  }
}
if (ok) console.log('All icons exist');
