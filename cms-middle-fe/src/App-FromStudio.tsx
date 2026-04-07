// /**
//  * @license
//  * SPDX-License-Identifier: Apache-2.0
//  */

// import React from 'react';
// import { 
//   Terminal, 
//   TriangleAlert, 
//   CheckCircle2, 
//   Info, 
//   AlertCircle, 
//   User, 
//   Cloud, 
//   ShieldCheck 
// } from 'lucide-react';

// // --- Data ---

// const CAMERAS = [
//   {
//     id: 'CAM-01',
//     name: 'MAIN_GATE',
//     ip: '192.168.1.101',
//     fps: 30,
//     image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnCLcv5AfAAxT0un5CHDUA6vy19OEBWdEp0y5FHZ-_SbezO6HQqPCbsjXjFWhto_paG68wqc9nGxBBYG7MhmdV1iCSQYJAKWRaSGFXKx8Nk_w5BVROENJrWvZ_oZxPYzl_M0zXag0ULvwf0VLMlXXVV6SQpaD68OaM_xc5IVMUnPChtT-Zo2FBR5LkI8c2XhmxBUSmoV8zPkdFa5j_Lz_eBSY1Rpk33AbwxokZbW1tR9Imnixhd2e_ONZk7oIWT5NgoWRMk4Jw1EE',
//   },
//   {
//     id: 'CAM-02',
//     name: 'LOBBY_NORTH',
//     ip: '192.168.1.102',
//     fps: 30,
//     image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB47qz983zoFml7wdHfTa_t5--ZWfiZHlFVCs6vRQ7BqQ1SpTmBUwX8uHLCDkn0Y8BNdQTYz0pfprM6r7ZiKpvYjNbleI1JgcrlcnKuoKC8VGIunsSP7QY-P91OzO00bxLPd4ogF84EaxIfukz__OUJPshVoaxEIjvE560I1TmGlncKKe_151gekifK6noIdfYqrjc3v6zBeqb9Beow-P9n3gVmt4ujTdwvZlJT2DK9Tk4wCq4taGSm5pwbvRZwJH_j4SGJKMH3_xI',
//   },
//   {
//     id: 'CAM-03',
//     name: 'PARKING_B1',
//     ip: '192.168.1.103',
//     fps: 30,
//     image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDo_bsqUyjkXmfjAY1PzP3uKkXBYV6XbXxBEqwk5vLOQ_hbUuzX0FAM_Px6K58WVbk2jmLSNXZlRGP01Pizkh_2dPxFtKZ6V1nL_jxS90EwTcv0CFhD_Bo8vdm5sHceUeGF7U7xruxqBf-33Z1_k-oomuqj6TojTHB-0Leuqumdyi1EVtXzL63ovdbY1_dHnDTQPuSR5ihd0jRLPk701TgKxgD_5JeyVtCoV_UImzBASqpnCD5KKrZCCILvz9L5eXhiIK3mhUWJWJU',
//   },
//   {
//     id: 'CAM-04',
//     name: 'SERVER_VAULT',
//     ip: '192.168.1.104',
//     fps: 30,
//     image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJOdVya0s7bHpvBdsdUFbPB_aqr9pXVQ67rRRA4g-vpKxRO4kFUiqfSK3U_JxTJfzWzZh8Qw3ZtjyuKgt_hDHbzCOqkPCyheT4Rg923b9IDpfy2cgv3QeDQGSrR471_v4_NGR8nob2OZHuR9BqZdE2Ts1JgjJXapUn4bVxIcnVIljlNRl5FuqLiAIu4VH6EmGOA-8gfe16bOFPNoEdh9a6HvuaBxAdOqZuuohk3aWi-PNMDuU35850V_07z5OEIE854-n-0IbLFQw',
//   },
//   {
//     id: 'CAM-05',
//     name: 'HALLWAY_4F',
//     ip: '192.168.1.105',
//     fps: 30,
//     image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsIMIM9n6bOr7zsY1CB9jGp7SvqwEfjYJK3M7QNiUWFIDmtjxLi8v46U31VDA_NtU0O2rkv3mcSxzkOIyKGZYZlsgmLrqRXy1_7BidbLleILUFAocfeCBfJBmhJCUkl0OI8FKQK2tKcBRQfrSXO-sKNs6JT2nm2EEnWPP0N9e01Nch1cYqm6pO7Irxyn1V5hds-upRDYjHirUWZBH4UxPJj2q0ScV8H5FJrRfRonqQq2vxeJdNWd5VFFFZUGS1tXi5rgV6WECLsGc',
//   },
//   {
//     id: 'CAM-06',
//     name: 'LOADING_DOCK',
//     ip: '192.168.1.106',
//     fps: 30,
//     image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBC3aHAWh6O_jjFfn82cm3S0LGp1NAv90JKaPHg_3d9W1LNp8poe6ZeTNcYp6WBP2lEKn5uS7UAnTqDO-azfrur7VtUgs0bZFM7PngsM411x_pKhM2wuLoqnErfyiSHNreEMGymJEPux7aVmSRcLe9H6zerNVHoXcrmdypWrbxAB_no406a1UhLzz9gHqOWkruFItrseGDq9rSO0ijzRZ20a3lKvz8kFRFHMIp606aMUeT-T-N19R6t5DoihOd0opB7MerJaJCLFs8',
//   },
// ];

// const LOGS = [
//   {
//     id: 1,
//     type: 'warning',
//     title: 'UNAUTHORIZED ACCESS',
//     time: '14:22:01',
//     message: 'Brute force attempt detected on NODE_04. Protocol halted.',
//     meta: 'SRC_IP: 104.22.11.45',
//     icon: TriangleAlert,
//   },
//   {
//     id: 2,
//     type: 'success',
//     title: 'BACKUP COMPLETE',
//     time: '14:15:30',
//     message: 'Daily archival cycle successfully pushed to tertiary vault.',
//     meta: 'SIZE: 14.8 TB // S3_REGION: WEST_1',
//     icon: CheckCircle2,
//   },
//   {
//     id: 3,
//     type: 'info',
//     title: 'FIRMWARE UPDATED',
//     time: '13:58:12',
//     message: 'CAM-02 to CAM-06 firmware patched to version v9.1.4.',
//     meta: 'SYS_REBOOT: NOT_REQUIRED',
//     icon: Info,
//   },
//   {
//     id: 4,
//     type: 'error',
//     title: 'MOTION ALERT',
//     time: '13:42:05',
//     message: 'Persistent motion detected in SECURED_ZONE_B after hours.',
//     meta: 'CAM_REF: CAM-04 // SENS: HIGH',
//     icon: AlertCircle,
//   },
//   {
//     id: 5,
//     type: 'info',
//     title: 'OPERATOR LOGIN',
//     time: '13:00:00',
//     message: 'Session initiated by OPERATOR_042 at terminal HUB_01.',
//     meta: 'AUTH: BIOMETRIC_PASSED',
//     icon: User,
//   },
// ];

// // --- Components ---

// function CameraFeed({ cam }: { cam: typeof CAMERAS[0] }) {
//   return (
//     <div className="group relative aspect-video bg-surface-container-lowest overflow-hidden rounded-sm">
//       <img 
//         src={cam.image} 
//         alt={cam.name}
//         className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
//         referrerPolicy="no-referrer"
//       />
//       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>
      
//       <div className="absolute top-3 left-3 flex flex-col">
//         <span className="text-[10px] font-bold font-headline text-primary tracking-widest bg-black/40 px-2 py-0.5 backdrop-blur-sm rounded-sm">
//           {cam.id} // {cam.name}
//         </span>
//         <span className="text-[9px] text-on-surface-variant font-mono mt-1 ml-1">
//           {cam.ip}
//         </span>
//       </div>
      
//       <div className="absolute bottom-3 right-3 flex items-center gap-2">
//         <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
//         <span className="text-[10px] font-semibold text-on-surface tracking-tighter">
//           {cam.fps} FPS
//         </span>
//       </div>
//     </div>
//   );
// }

// function StatusBar() {
//   return (
//     <div className="border-t border-outline-variant/10 bg-surface-container-low flex flex-col">
//       <div className="flex border-b border-outline-variant/10 px-6">
//         <button className="px-6 py-3 border-b-2 border-primary text-primary text-[10px] font-bold tracking-[0.2em] uppercase bg-surface-container">
//           Current Machine Info
//         </button>
//         <button className="px-6 py-3 text-on-surface-variant hover:text-on-surface text-[10px] font-bold tracking-[0.2em] uppercase transition-colors">
//           Incoming Data Info
//         </button>
//         <button className="px-6 py-3 text-on-surface-variant hover:text-on-surface text-[10px] font-bold tracking-[0.2em] uppercase transition-colors">
//           Outgoing Data Info
//         </button>
//       </div>
      
//       <div className="h-40 p-6">
//         <div className="grid grid-cols-4 gap-8 h-full items-center">
          
//           <div className="flex flex-col gap-2">
//             <span className="text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Network Host IP</span>
//             <div className="text-2xl font-headline text-primary">192.168.1.10</div>
//             <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
//               <div className="w-3/4 h-full bg-primary-container"></div>
//             </div>
//           </div>
          
//           <div className="flex flex-col gap-2">
//             <span className="text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Storage Server</span>
//             <div className="flex items-center gap-3">
//               <div className="text-2xl font-headline text-secondary uppercase">Active</div>
//               <Cloud className="text-secondary w-6 h-6 fill-secondary/20" />
//             </div>
//             <span className="text-[11px] text-on-surface-variant">NODE: US-WEST-DDR-01</span>
//           </div>
          
//           <div className="flex flex-col gap-2">
//             <span className="text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Bandwidth Consumption</span>
//             <div className="text-2xl font-headline text-on-surface">
//               842 <span className="text-sm font-label text-on-surface-variant">Mb/s</span>
//             </div>
//             <div className="flex gap-1 h-2 items-end">
//               <div className="w-1.5 h-1/2 bg-secondary"></div>
//               <div className="w-1.5 h-2/3 bg-secondary"></div>
//               <div className="w-1.5 h-full bg-primary"></div>
//               <div className="w-1.5 h-4/5 bg-secondary"></div>
//               <div className="w-1.5 h-1/3 bg-secondary"></div>
//             </div>
//           </div>
          
//           <div className="flex flex-col gap-2">
//             <span className="text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Logs Recv / Sent</span>
//             <div className="text-2xl font-headline text-primary">
//               14,204 <span className="text-sm font-label text-on-surface-variant">/ 14,198</span>
//             </div>
//             <span className="text-[11px] text-secondary-dim flex items-center gap-1">
//               <ShieldCheck className="w-3 h-3" />
//               SYNCED
//             </span>
//           </div>
          
//         </div>
//       </div>
//     </div>
//   );
// }

// function LogEntry({ log }: { log: typeof LOGS[0] }) {
//   const Icon = log.icon;
  
//   let colorClass = '';
//   let bgBorderClass = '';
  
//   switch (log.type) {
//     case 'warning':
//     case 'error':
//       colorClass = 'text-tertiary';
//       bgBorderClass = 'bg-tertiary';
//       break;
//     case 'success':
//       colorClass = 'text-secondary';
//       bgBorderClass = 'bg-secondary';
//       break;
//     case 'info':
//     default:
//       colorClass = 'text-primary';
//       bgBorderClass = 'bg-primary';
//       break;
//   }

//   return (
//     <div className="relative pl-3 py-2 bg-surface-container-high/40 rounded-r-lg group hover:bg-surface-container-high transition-colors">
//       <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${bgBorderClass}`}></div>
//       <div className="flex justify-between items-start mb-1">
//         <span className={`text-[10px] font-bold ${colorClass} uppercase flex items-center gap-1`}>
//           <Icon className="w-3 h-3" />
//           {log.title}
//         </span>
//         <span className="text-[9px] font-mono text-on-surface-variant">{log.time}</span>
//       </div>
//       <p className="text-[11px] text-on-surface leading-tight mb-1">{log.message}</p>
//       <div className="text-[9px] font-mono text-on-surface-variant">{log.meta}</div>
//     </div>
//   );
// }

// function Footer() {
//   return (
//     <footer className="fixed bottom-0 left-0 w-full z-40 flex justify-between items-center px-6 py-2 bg-background/80 backdrop-blur-md border-t border-surface-container-high/30">
//       <div className="flex gap-4">
//         <span className="font-body text-[10px] uppercase tracking-widest font-semibold text-on-surface/40 hover:text-primary transition-colors cursor-default">LATENCY: 12ms</span>
//         <span className="font-body text-[10px] uppercase tracking-widest font-semibold text-on-surface/40 hover:text-primary transition-colors cursor-default">CPU: 24%</span>
//         <span className="font-body text-[10px] uppercase tracking-widest font-semibold text-on-surface/40 hover:text-primary transition-colors cursor-default">STORAGE: 88% FREE</span>
//       </div>
//       <div className="flex items-center gap-4">
//         <span className="font-body text-[10px] uppercase tracking-widest font-semibold text-secondary">ENCRYPTION: AES-256</span>
//         <div className="h-3 w-[1px] bg-outline-variant/30"></div>
//         <span className="font-body text-[10px] uppercase tracking-widest font-semibold text-on-surface/40">SURVEILLANCE INTELLIGENCE UNIT // SYSTEM.V.4.2</span>
//       </div>
//     </footer>
//   );
// }

// export default function App() {
//   return (
//     <div className="flex flex-col h-screen overflow-hidden bg-background text-on-surface font-body selection:bg-primary/30">
//       <main className="flex-1 grid grid-cols-12 gap-0 overflow-hidden pb-8">
//         {/* Left Section */}
//         <div className="col-span-9 flex flex-col overflow-hidden bg-background">
//           <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
//             <div className="grid grid-cols-3 gap-4">
//               {CAMERAS.map(cam => (
//                 <CameraFeed key={cam.id} cam={cam} />
//               ))}
//             </div>
//           </div>
//           <StatusBar />
//         </div>

//         {/* Right Section */}
//         <aside className="col-span-3 bg-surface-container-low border-l border-outline-variant/10 flex flex-col overflow-hidden">
//           <div className="p-4 flex items-center justify-between border-b border-outline-variant/10">
//             <div className="flex items-center gap-2">
//               <Terminal className="text-primary w-4 h-4" />
//               <h2 className="font-headline text-xs tracking-[0.15em] uppercase text-on-surface mt-0.5">System Intelligence Log</h2>
//             </div>
//             <span className="text-[9px] font-mono text-on-surface-variant">UTC-08:00</span>
//           </div>
          
//           <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
//             {LOGS.map(log => (
//               <LogEntry key={log.id} log={log} />
//             ))}
//           </div>
          
//           <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/10">
//             <div className="flex items-center gap-2 mb-2">
//               <span className="text-[10px] text-primary uppercase tracking-[0.2em] font-bold">SYSTEM V.4.2</span>
//             </div>
//             <div className="text-[9px] text-on-surface-variant font-mono uppercase">
//               VRS_PROCESSOR: 100% // ENCRYPTION: AES-256
//             </div>
//           </div>
//         </aside>
//       </main>

//       <Footer />
//     </div>
//   );
// }
