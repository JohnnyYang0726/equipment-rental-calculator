import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, Copy, Check, Info, Monitor, Printer, Laptop, Truck, ShieldAlert,
  CheckCircle2, ChevronDown, Receipt
} from 'lucide-react';

// Types
type Category = 'laser' | 'inkjet' | 'dot_matrix' | 'desktop' | 'laptop';
type LaserType = 'bw_single' | 'bw_multi' | 'color_single' | 'color_multi';
type InkjetType = 'bw_single' | 'bw_multi' | 'color_single' | 'color_multi';
type DotMatrixType = 'lq310' | 'lq690c';
type DesktopDuration = 'short' | 'month';
type DesktopShortType = 'base' | 'monitor' | 'office365';
type DesktopMonthType = 'office' | 'graphic' | 'custom_graphic';
type LaptopType = 'office' | 'gaming';
type LaptopDuration = 'short' | 'month';

export default function App() {
  const [category, setCategory] = useState<Category>('laser');
  
  // Laser state
  const [laserType, setLaserType] = useState<LaserType>('bw_single');
  const [laserPlan, setLaserPlan] = useState<string>('plan1');
  const [laserDays, setLaserDays] = useState<number>(1);
  const [laserColors, setLaserColors] = useState<number>(1);
  const [laserBwPages, setLaserBwPages] = useState<number>(0);
  const [laserColorPages, setLaserColorPages] = useState<number>(0);

  // Inkjet state
  const [inkjetType, setInkjetType] = useState<InkjetType>('bw_single');
  const [inkjetDays, setInkjetDays] = useState<number>(1);
  const [inkjetMonths, setInkjetMonths] = useState<number>(1);
  const [inkjetBwPages, setInkjetBwPages] = useState<number>(0);

  // Dot Matrix state
  const [dotMatrixType, setDotMatrixType] = useState<DotMatrixType>('lq310');
  const [dotMatrixDays, setDotMatrixDays] = useState<number>(1);

  // Desktop state
  const [desktopDuration, setDesktopDuration] = useState<DesktopDuration>('short');
  const [desktopShortType, setDesktopShortType] = useState<DesktopShortType>('base');
  const [desktopMonthType, setDesktopMonthType] = useState<DesktopMonthType>('office');
  const [desktopDays, setDesktopDays] = useState<number>(1);
  const [desktopMonths, setDesktopMonths] = useState<number>(1);

  // Laptop state
  const [laptopType, setLaptopType] = useState<LaptopType>('office');
  const [laptopDuration, setLaptopDuration] = useState<LaptopDuration>('short');
  const [laptopDays, setLaptopDays] = useState<number>(1);
  const [laptopMonths, setLaptopMonths] = useState<number>(1);

  // Global Add-ons
  const [deliverySetup, setDeliverySetup] = useState<boolean>(false);
  const [depositReminder, setDepositReminder] = useState<boolean>(false);
  const [customSoftware, setCustomSoftware] = useState<boolean>(false);
  const [customSoftwareFee, setCustomSoftwareFee] = useState<number>(0);

  const [copied, setCopied] = useState(false);

  // Constraints
  useEffect(() => {
    if (laptopType === 'gaming' && laptopDuration === 'short') {
      setLaptopDuration('month');
    }
  }, [laptopType, laptopDuration]);

  const summary = useMemo(() => {
    let title = '';
    let details: string[] = [];
    let baseCost = 0;
    let usageCost = 0;
    const oneTimeCost = (deliverySetup ? 800 : 0) + (customSoftware ? customSoftwareFee : 0);
    let deposit = depositReminder ? 2000 : 0;
    
    if (category === 'laser') {
      title = '雷射印表機租賃';
      if (laserType === 'bw_single') {
         details.push(`設備：單功能黑白`);
         details.push(`方案：日租 $100/日 (含 50 張)`);
         details.push(`租期：${Math.max(1, laserDays)} 天`);
         baseCost = 100 * Math.max(1, laserDays);
         usageCost = Math.max(0, laserBwPages - 50) * 1;
         if (usageCost > 0) details.push(`超印費用：$${usageCost.toLocaleString()} (${laserBwPages - 50}張 x $1)`);
      } else if (laserType === 'bw_multi') {
         details.push(`設備：多功能黑白`);
         details.push(`方案：日租 $150/日 (含 50 張)`);
         details.push(`租期：${Math.max(1, laserDays)} 天`);
         baseCost = 150 * Math.max(1, laserDays);
         usageCost = Math.max(0, laserBwPages - 50) * 3;
         if (usageCost > 0) details.push(`超印費用：$${usageCost.toLocaleString()} (${laserBwPages - 50}張 x $3)`);
      } else if (laserType === 'color_single') {
         const planPrice = laserPlan === 'plan1' ? 100 : 200;
         const planName = laserPlan === 'plan1' ? '基本租機 $100/日' : '基本租機 $200/日';
         details.push(`設備：單功能彩色 (方案${laserPlan === 'plan1' ? '1' : '2'})`);
         details.push(`方案：${planName} (依張數計價)`);
         details.push(`租期：${Math.max(1, laserDays)} 天`);
         baseCost = planPrice * Math.max(1, laserDays);
         usageCost = (Math.max(0, laserBwPages) + Math.max(0, laserColorPages)) * 3;
         if (usageCost > 0) details.push(`列印費用：$${usageCost.toLocaleString()} (${laserBwPages + laserColorPages}張 x $3)`);
      } else if (laserType === 'color_multi') {
         details.push(`設備：多功能彩色`);
         details.push(`方案：買碳免買機 ($1,500/色)`);
         details.push(`數量：${Math.max(1, laserColors)} 色`);
         baseCost = 1500 * Math.max(1, laserColors);
      }
    } else if (category === 'inkjet') {
      title = '噴墨印表機租賃';
      if (inkjetType === 'bw_single') {
         details.push(`設備：單功能黑白 (噴墨)`);
         details.push(`方案：日租 $100/日 (含 50 張)`);
         details.push(`租期：${Math.max(1, inkjetDays)} 天`);
         baseCost = 100 * Math.max(1, inkjetDays);
         usageCost = Math.floor(Math.max(0, inkjetBwPages - 50) * 0.3);
         if (usageCost > 0) details.push(`超印費用：$${usageCost.toLocaleString()} (${inkjetBwPages - 50}張 x $0.3)`);
      } else if (inkjetType === 'bw_multi') {
         details.push(`設備：多功能黑白 (噴墨)`);
         details.push(`方案：日租 $150/日 (含 50 張)`);
         details.push(`租期：${Math.max(1, inkjetDays)} 天`);
         baseCost = 150 * Math.max(1, inkjetDays);
         usageCost = Math.floor(Math.max(0, inkjetBwPages - 50) * 0.3);
         if (usageCost > 0) details.push(`超印費用：$${usageCost.toLocaleString()} (${inkjetBwPages - 50}張 x $0.3)`);
      } else if (inkjetType === 'color_single') {
         details.push(`設備：單功能彩色 (噴墨)`);
         details.push(`方案：月租 $1,500/月`);
         details.push(`租期：${Math.max(1, inkjetMonths)} 個月`);
         baseCost = 1500 * Math.max(1, inkjetMonths);
      } else if (inkjetType === 'color_multi') {
         details.push(`設備：多功能彩色 (噴墨)`);
         details.push(`方案：月租 $1,500/月`);
         details.push(`租期：${Math.max(1, inkjetMonths)} 個月`);
         baseCost = 1500 * Math.max(1, inkjetMonths);
      }
    } else if (category === 'dot_matrix') {
      title = '點陣印表機租賃';
      if (dotMatrixType === 'lq310') {
         details.push(`設備：LQ310類似後進紙入門規格`);
         details.push(`方案：日租 $100/日 (含每日 100 張)`);
         details.push(`租期：${Math.max(1, dotMatrixDays)} 天`);
         baseCost = 100 * Math.max(1, dotMatrixDays);
      } else if (dotMatrixType === 'lq690c') {
         details.push(`設備：LQ690類似(前)後進紙高階規格`);
         details.push(`方案：日租 $200/日 (含每日 100 張)`);
         details.push(`租期：${Math.max(1, dotMatrixDays)} 天`);
         baseCost = 200 * Math.max(1, dotMatrixDays);
      }
    } else if (category === 'desktop') {
      title = '桌上型電腦租賃';
      if (desktopDuration === 'short') {
        let price = 100;
        let name = '文書桌機';
        if (desktopShortType === 'monitor') { price = 200; name = '文書桌機 (含螢幕)'; }
        if (desktopShortType === 'office365') { price = 300; name = '文書桌機 (含 Office365)'; }
        if (depositReminder) deposit = 4000;
        details.push(`設備：${name}`);
        details.push(`方案：日租 $${price}/日`);
        details.push(`租期：${Math.max(1, desktopDays)} 天`);
        baseCost = price * Math.max(1, desktopDays);
      } else {
        let price = 600;
        let name = '文書庫存桌機 (8代內 CPU + 24吋螢幕)';
        if (depositReminder) deposit = 4000;
        if (desktopMonthType === 'graphic') { 
            price = 1000; 
            name = '繪圖庫存桌機 (9代內 CPU + 24吋螢幕)'; 
            if (depositReminder) deposit = 8000; 
        } else if (desktopMonthType === 'custom_graphic') {
            price = 2000;
            name = '客製化繪圖桌機 (9代內+32G+RTX獨顯+24吋螢幕)';
            if (depositReminder) deposit = 12000;
        }
        details.push(`設備：${name}`);
        details.push(`方案：月租 $${price}/月`);
        details.push(`租期：${Math.max(1, desktopMonths)} 個月`);
        baseCost = price * Math.max(1, desktopMonths);
      }
    } else if (category === 'laptop') {
      title = '筆記型電腦租賃';
      const typeName = laptopType === 'office' ? '文書筆電' : '電競筆電';
      if (depositReminder) deposit = laptopType === 'office' ? 4000 : 8000;
      details.push(`設備：${typeName}`);
      
      if (laptopDuration === 'short') {
         const validDays = Math.min(15, Math.max(1, laptopDays));
         details.push(`方案：短租方案 (15天內)`);
         details.push(`租期：${validDays} 天`);
         baseCost = 850 + (validDays - 1) * 150;
      } else {
         const price = laptopType === 'office' ? 1500 : 3000;
         details.push(`方案：月租方案 ($${price.toLocaleString()}/月)`);
         details.push(`租期：${Math.max(1, laptopMonths)} 個月`);
         baseCost = price * Math.max(1, laptopMonths);
      }
    }

    const totalCost = baseCost + usageCost + oneTimeCost;

    return { title, details, baseCost, usageCost, oneTimeCost, totalCost, deposit };
  }, [
    category, 
    laserType, laserPlan, laserDays, laserColors, laserBwPages, laserColorPages,
    inkjetType, inkjetDays, inkjetMonths, inkjetBwPages,
    dotMatrixType, dotMatrixDays,
    desktopDuration, desktopShortType, desktopMonthType, desktopDays, desktopMonths,
    laptopType, laptopDuration, laptopDays, laptopMonths,
    deliverySetup, depositReminder, customSoftware, customSoftwareFee
  ]);

  const handleCopy = () => {
     let oneTimeStr = '';
     if (deliverySetup) oneTimeStr += `\n運送與設定費：$800`;
     if (customSoftware) oneTimeStr += `\n客製化軟體費：$${customSoftwareFee.toLocaleString()}`;

     const text = `【租賃報價摘要】\n項目：${summary.title}\n\n[規格與方案]\n${summary.details.map(d => '• ' + d).join('\n')}\n\n[費用明細]\n基本租金：$${summary.baseCost.toLocaleString()}${summary.usageCost > 0 ? `\n超印費用：$${summary.usageCost.toLocaleString()}` : ''}${oneTimeStr}\n-------------------\n預估總費用：$${summary.totalCost.toLocaleString()}${depositReminder ? `\n\n(註：需另收取設備押金 $${summary.deposit.toLocaleString()} / 台)` : ''}`;
     
     navigator.clipboard.writeText(text).then(() => {
       setCopied(true);
       setTimeout(() => setCopied(false), 2000);
     });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center md:text-left flex flex-col md:flex-row items-center gap-5">
          <div className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
            <Calculator className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">設備租賃費用試算器</h1>
            <p className="text-slate-500 mt-1.5 text-sm md:text-base">依據您的需求，快速評估各類型辦公設備的租賃方案及預估費用</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* Category Tabs */}
            <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-row gap-1.5 flex-wrap">
              <button 
                onClick={() => setCategory('laser')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-sm font-semibold transition-all ${category === 'laser' ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-600/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span className="truncate">雷射印表機</span>
              </button>
              <button 
                onClick={() => setCategory('inkjet')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-sm font-semibold transition-all ${category === 'inkjet' ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-600/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span className="truncate">噴墨印表機</span>
              </button>
              <button 
                onClick={() => setCategory('dot_matrix')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-sm font-semibold transition-all ${category === 'dot_matrix' ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-600/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span className="truncate">點陣印表機</span>
              </button>
              <button 
                onClick={() => setCategory('desktop')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-sm font-semibold transition-all ${category === 'desktop' ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-600/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                <Monitor className="w-4 h-4 shrink-0" />
                <span className="truncate">桌上型電腦</span>
              </button>
              <button 
                onClick={() => setCategory('laptop')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-sm font-semibold transition-all ${category === 'laptop' ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-600/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                <Laptop className="w-4 h-4 shrink-0" />
                <span className="truncate">筆記型電腦</span>
              </button>
            </div>

            {/* Configuration Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 md:p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2.5 text-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  規格與方案設定
                </h2>

                {/* --- Category: Laser Printer --- */}
                {category === 'laser' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-slate-700">選擇雷射印表機類型</label>
                      <div className="relative">
                        <select 
                          value={laserType} 
                          onChange={e => setLaserType(e.target.value as LaserType)}
                          className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium cursor-pointer"
                        >
                          <option value="bw_single">單功能黑白</option>
                          <option value="bw_multi">多功能黑白</option>
                          <option value="color_single">單功能彩色</option>
                          <option value="color_multi">多功能彩色</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {(laserType === 'bw_single' || laserType === 'bw_multi') && (
                      <>
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-slate-700">方案內容</label>
                          <div className="p-4 rounded-xl border-2 border-slate-200 bg-slate-50 flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                            <div>
                              <div className="font-bold text-slate-900">
                                {laserType === 'bw_single' ? '日租 $100 / 日' : '日租 $150 / 日'}
                              </div>
                              <div className="text-sm text-slate-500 mt-1.5 leading-relaxed">含印量 50 張。每張超出收取 {laserType === 'bw_single' ? '$1' : '$3'}。</div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-slate-700">租賃天數</label>
                          <div className="relative">
                            <input type="number" min="1" value={laserDays} onChange={e => setLaserDays(parseInt(e.target.value) || 1)} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-4 pr-12 py-3.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium" />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">天</span>
                          </div>
                        </div>
                        <div className="pt-6 mt-6 border-t border-slate-100">
                          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-slate-500"/> 預估印量 (選填，超出將計費)
                          </h3>
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">預估黑白張數</label>
                            <div className="relative">
                              <input type="number" min="0" value={laserBwPages} onChange={e => setLaserBwPages(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-4 pr-12 py-3 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium" />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">張</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {laserType === 'color_single' && (
                      <>
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-slate-700">選擇方案</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${laserPlan === 'plan1' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300'}`}>
                              <div>
                                <div className="font-bold text-slate-900">方案 1</div>
                                <div className="text-sm text-slate-500 mt-1">基本租機 $100/日 (無含印量)</div>
                              </div>
                              <input type="radio" name="laserPlan" value="plan1" checked={laserPlan === 'plan1'} onChange={() => setLaserPlan('plan1')} className="sr-only" />
                              {laserPlan === 'plan1' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                            </label>
                            <label className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${laserPlan === 'plan2' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300'}`}>
                              <div>
                                <div className="font-bold text-slate-900">方案 2</div>
                                <div className="text-sm text-slate-500 mt-1">基本租機 $200/日 (無含印量)</div>
                              </div>
                              <input type="radio" name="laserPlan" value="plan2" checked={laserPlan === 'plan2'} onChange={() => setLaserPlan('plan2')} className="sr-only" />
                              {laserPlan === 'plan2' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                            </label>
                          </div>
                          <div className="text-sm text-slate-500 mt-1 pl-1">註：依張計價，每張 $3。</div>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-slate-700">租賃天數</label>
                          <div className="relative">
                            <input type="number" min="1" value={laserDays} onChange={e => setLaserDays(parseInt(e.target.value) || 1)} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-4 pr-12 py-3.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium" />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">天</span>
                          </div>
                        </div>
                        <div className="pt-6 mt-6 border-t border-slate-100">
                          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-slate-500"/> 預估印量 (選填，依張計費)
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">黑白張數</label>
                              <div className="relative">
                                <input type="number" min="0" value={laserBwPages} onChange={e => setLaserBwPages(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-4 pr-12 py-3 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium" />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">張</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">彩色張數</label>
                              <div className="relative">
                                <input type="number" min="0" value={laserColorPages} onChange={e => setLaserColorPages(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-4 pr-12 py-3 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium" />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">張</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {laserType === 'color_multi' && (
                      <>
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-slate-700">方案內容</label>
                          <div className="p-4 rounded-xl border-2 border-slate-200 bg-slate-50 flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                            <div>
                              <div className="font-bold text-slate-900">買碳免買機 ($1,500 / 色)</div>
                              <div className="text-sm text-slate-500 mt-1.5 leading-relaxed">依碳粉數量計價。</div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-slate-700">購買顏色數量</label>
                          <div className="relative">
                            <input type="number" min="1" value={laserColors} onChange={e => setLaserColors(parseInt(e.target.value) || 1)} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-4 pr-14 py-3.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium" />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">色</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* --- Category: Inkjet Printer --- */}
                {category === 'inkjet' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-slate-700">選擇噴墨印表機類型</label>
                      <div className="relative">
                        <select 
                          value={inkjetType} 
                          onChange={e => setInkjetType(e.target.value as InkjetType)}
                          className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium cursor-pointer"
                        >
                          <option value="bw_single">單功能黑白</option>
                          <option value="bw_multi">多功能黑白</option>
                          <option value="color_single">單功能彩色</option>
                          <option value="color_multi">多功能彩色</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {(inkjetType === 'bw_single' || inkjetType === 'bw_multi') && (
                      <>
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-slate-700">方案內容</label>
                          <div className="p-4 rounded-xl border-2 border-slate-200 bg-slate-50 flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                            <div>
                              <div className="font-bold text-slate-900">
                                {inkjetType === 'bw_single' ? '日租 $100 / 日' : '日租 $150 / 日'}
                              </div>
                              <div className="text-sm text-slate-500 mt-1.5 leading-relaxed">含印量 50 張。每張超出收取 $0.3。</div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-slate-700">租賃天數</label>
                          <div className="relative">
                            <input type="number" min="1" value={inkjetDays} onChange={e => setInkjetDays(parseInt(e.target.value) || 1)} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-4 pr-12 py-3.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium" />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">天</span>
                          </div>
                        </div>
                        <div className="pt-6 mt-6 border-t border-slate-100">
                          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-slate-500"/> 預估印量 (選填，超出將計費)
                          </h3>
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">預估黑白張數</label>
                            <div className="relative">
                              <input type="number" min="0" value={inkjetBwPages} onChange={e => setInkjetBwPages(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-4 pr-12 py-3 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium" />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">張</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {(inkjetType === 'color_single' || inkjetType === 'color_multi') && (
                      <>
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-slate-700">方案內容</label>
                          <div className="p-4 rounded-xl border-2 border-slate-200 bg-slate-50 flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                            <div>
                              <div className="font-bold text-slate-900">月租 $1,500 / 月</div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-slate-700">租賃月數</label>
                          <div className="relative">
                            <input type="number" min="1" value={inkjetMonths} onChange={e => setInkjetMonths(parseInt(e.target.value) || 1)} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-4 pr-14 py-3.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium" />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">個月</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* --- Category: Dot Matrix Printer --- */}
                {category === 'dot_matrix' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-slate-700">選擇設備類型</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${dotMatrixType === 'lq310' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300'}`}>
                          <div>
                            <div className="font-bold text-slate-900">LQ310類似後進紙入門規格</div>
                            <div className="text-sm text-slate-500 mt-1">$100 / 日</div>
                          </div>
                          <input type="radio" name="dotMatrixType" value="lq310" checked={dotMatrixType === 'lq310'} onChange={() => setDotMatrixType('lq310')} className="sr-only" />
                          {dotMatrixType === 'lq310' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                        </label>
                        <label className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${dotMatrixType === 'lq690c' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300'}`}>
                          <div>
                            <div className="font-bold text-slate-900">LQ690類似(前)後進紙高階規格</div>
                            <div className="text-sm text-slate-500 mt-1">$200 / 日</div>
                          </div>
                          <input type="radio" name="dotMatrixType" value="lq690c" checked={dotMatrixType === 'lq690c'} onChange={() => setDotMatrixType('lq690c')} className="sr-only" />
                          {dotMatrixType === 'lq690c' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                        </label>
                      </div>
                      <div className="text-sm text-slate-500 mt-1 pl-1 flex items-center gap-1.5">
                         <Info className="w-4 h-4" /> 含每日 100 張印量，超過需事前雙方協議。
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-slate-700">租賃天數</label>
                      <div className="relative">
                        <input type="number" min="1" value={dotMatrixDays} onChange={e => setDotMatrixDays(parseInt(e.target.value) || 1)} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-4 pr-12 py-3.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">天</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- Category: Desktop --- */}
                {category === 'desktop' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-slate-700">租期類型</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${desktopDuration === 'short' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300'}`}>
                          <div>
                            <div className="font-bold text-slate-900">短租 (按天計費)</div>
                          </div>
                          <input type="radio" name="desktopDuration" value="short" checked={desktopDuration === 'short'} onChange={() => setDesktopDuration('short')} className="sr-only" />
                          {desktopDuration === 'short' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                        </label>
                        <label className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${desktopDuration === 'month' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300'}`}>
                          <div>
                            <div className="font-bold text-slate-900">長租 (按月計費)</div>
                          </div>
                          <input type="radio" name="desktopDuration" value="month" checked={desktopDuration === 'month'} onChange={() => setDesktopDuration('month')} className="sr-only" />
                          {desktopDuration === 'month' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                        </label>
                      </div>
                    </div>

                    {desktopDuration === 'short' ? (
                      <>
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-slate-700">選擇方案</label>
                          <div className="grid grid-cols-1 gap-3">
                            <label className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${desktopShortType === 'base' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300'}`}>
                              <div>
                                <div className="font-bold text-slate-900">文書桌機</div>
                                <div className="text-sm text-slate-500 mt-1">$100 / 日</div>
                              </div>
                              <input type="radio" name="desktopShortType" value="base" checked={desktopShortType === 'base'} onChange={() => setDesktopShortType('base')} className="sr-only" />
                              {desktopShortType === 'base' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                            </label>
                            <label className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${desktopShortType === 'monitor' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300'}`}>
                              <div>
                                <div className="font-bold text-slate-900">文書桌機 + 螢幕</div>
                                <div className="text-sm text-slate-500 mt-1">$200 / 日</div>
                              </div>
                              <input type="radio" name="desktopShortType" value="monitor" checked={desktopShortType === 'monitor'} onChange={() => setDesktopShortType('monitor')} className="sr-only" />
                              {desktopShortType === 'monitor' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                            </label>
                            <label className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${desktopShortType === 'office365' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300'}`}>
                              <div>
                                <div className="font-bold text-slate-900">文書桌機 + 螢幕 + Office365</div>
                                <div className="text-sm text-slate-500 mt-1">$300 / 日</div>
                              </div>
                              <input type="radio" name="desktopShortType" value="office365" checked={desktopShortType === 'office365'} onChange={() => setDesktopShortType('office365')} className="sr-only" />
                              {desktopShortType === 'office365' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                            </label>
                          </div>
                          <div className="text-sm text-amber-600 mt-1 pl-1 flex items-center gap-1.5">
                            <Info className="w-4 h-4" /> 租賃超過 1 個月需另議合約。電競系統不提供短租。
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-slate-700">租賃天數</label>
                          <div className="relative">
                            <input type="number" min="1" value={desktopDays} onChange={e => setDesktopDays(parseInt(e.target.value) || 1)} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-4 pr-12 py-3.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium" />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">天</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-slate-700">選擇庫存機等級</label>
                          <div className="grid grid-cols-1 gap-3">
                            <label className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${desktopMonthType === 'office' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300'}`}>
                              <div>
                                <div className="font-bold text-slate-900">文書庫存桌機</div>
                                <div className="text-sm text-slate-500 mt-1">8代內 CPU + 24吋螢幕 ｜ $600 / 月</div>
                              </div>
                              <input type="radio" name="desktopMonthType" value="office" checked={desktopMonthType === 'office'} onChange={() => setDesktopMonthType('office')} className="sr-only" />
                              {desktopMonthType === 'office' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                            </label>
                            <label className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${desktopMonthType === 'graphic' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300'}`}>
                              <div>
                                <div className="font-bold text-slate-900">繪圖庫存桌機</div>
                                <div className="text-sm text-slate-500 mt-1">9代內 CPU + 24吋螢幕 ｜ $1,000 / 月</div>
                              </div>
                              <input type="radio" name="desktopMonthType" value="graphic" checked={desktopMonthType === 'graphic'} onChange={() => setDesktopMonthType('graphic')} className="sr-only" />
                              {desktopMonthType === 'graphic' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                            </label>
                            <label className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${desktopMonthType === 'custom_graphic' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300'}`}>
                              <div>
                                <div className="font-bold text-slate-900">客製化繪圖桌機</div>
                                <div className="text-sm text-slate-500 mt-1">9代內+32G+RTX獨顯+24吋螢幕 ｜ $2,000 / 月</div>
                              </div>
                              <input type="radio" name="desktopMonthType" value="custom_graphic" checked={desktopMonthType === 'custom_graphic'} onChange={() => setDesktopMonthType('custom_graphic')} className="sr-only" />
                              {desktopMonthType === 'custom_graphic' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                            </label>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-slate-700">租賃月數</label>
                          <div className="relative">
                            <input type="number" min="1" value={desktopMonths} onChange={e => setDesktopMonths(parseInt(e.target.value) || 1)} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-4 pr-14 py-3.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium" />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">個月</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* --- Category: Laptop --- */}
                {category === 'laptop' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-slate-700">設備規格</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${laptopType === 'office' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300'}`}>
                          <div>
                            <div className="font-bold text-slate-900">文書筆電</div>
                            <div className="text-sm text-slate-500 mt-1">提供短租與月租方案</div>
                          </div>
                          <input type="radio" name="laptopType" value="office" checked={laptopType === 'office'} onChange={() => setLaptopType('office')} className="sr-only" />
                          {laptopType === 'office' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                        </label>
                        <label className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${laptopType === 'gaming' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300'}`}>
                          <div>
                            <div className="font-bold text-slate-900">電競筆電</div>
                            <div className="text-sm text-slate-500 mt-1">僅限月租方案</div>
                          </div>
                          <input type="radio" name="laptopType" value="gaming" checked={laptopType === 'gaming'} onChange={() => setLaptopType('gaming')} className="sr-only" />
                          {laptopType === 'gaming' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                        </label>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-slate-700">租期類型</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${laptopType === 'gaming' ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50' : (laptopDuration === 'short' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300')}`}>
                          <div>
                            <div className="font-bold text-slate-900">短租方案</div>
                            <div className="text-sm text-slate-500 mt-1">15天內短租特惠</div>
                          </div>
                          <input type="radio" name="laptopDuration" value="short" disabled={laptopType === 'gaming'} checked={laptopDuration === 'short'} onChange={() => setLaptopDuration('short')} className="sr-only" />
                          {laptopDuration === 'short' && laptopType !== 'gaming' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                        </label>
                        <label className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${laptopDuration === 'month' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-blue-300'}`}>
                          <div>
                            <div className="font-bold text-slate-900">月租方案</div>
                            <div className="text-sm text-slate-500 mt-1">1個月以上</div>
                          </div>
                          <input type="radio" name="laptopDuration" value="month" checked={laptopDuration === 'month'} onChange={() => setLaptopDuration('month')} className="sr-only" />
                          {laptopDuration === 'month' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                        </label>
                      </div>
                    </div>

                    {laptopDuration === 'short' ? (
                      <div className="space-y-3">
                        <div className="p-4 rounded-xl border-2 border-slate-200 bg-slate-50 flex items-start gap-3">
                          <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-900">最低起租價 $850 (15天內)</div>
                            <div className="text-sm text-slate-500 mt-1.5 leading-relaxed">首日基本費 $850，第2天起每日追加 $150 (最高至15天，超過15天視同月租)。</div>
                          </div>
                        </div>
                        <label className="block text-sm font-semibold text-slate-700">租賃天數 (最高15天)</label>
                        <div className="relative">
                          <input type="number" min="1" max="15" value={laptopDays} onChange={e => setLaptopDays(parseInt(e.target.value) || 1)} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-4 pr-12 py-3.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium" />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">天</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-4 rounded-xl border-2 border-slate-200 bg-slate-50 flex items-start gap-3">
                          <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-900">月租 $ {laptopType === 'office' ? '1,500' : '3,000'} / 月</div>
                          </div>
                        </div>
                        <label className="block text-sm font-semibold text-slate-700">租賃月數</label>
                        <div className="relative">
                          <input type="number" min="1" value={laptopMonths} onChange={e => setLaptopMonths(parseInt(e.target.value) || 1)} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-4 pr-14 py-3.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium" />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">個月</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Global Add-ons */}
              <div className="bg-slate-50 p-6 md:p-8 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-500" />
                  附加選項
                </h3>
                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center mt-0.5">
                      <input type="checkbox" checked={deliverySetup} onChange={e => setDeliverySetup(e.target.checked)} className="peer sr-only" />
                      <div className="w-5 h-5 border-2 border-slate-300 rounded-md peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-500" /> 專人運送與網路驅動設定費
                        <span className="text-blue-600 bg-blue-100 text-xs px-2 py-0.5 rounded-full">+$800 單次</span>
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center mt-0.5">
                      <input type="checkbox" checked={depositReminder} onChange={e => setDepositReminder(e.target.checked)} className="peer sr-only" />
                      <div className="w-5 h-5 border-2 border-slate-300 rounded-md peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-colors flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-amber-700 transition-colors flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-slate-500" /> 設備預收押金提醒
                        <span className="text-amber-600 bg-amber-100 text-xs px-2 py-0.5 rounded-full">
                          {(() => {
                            if (category === 'desktop') {
                              return desktopDuration === 'month' && desktopMonthType === 'custom_graphic' ? '$12,000 / 台' : (desktopDuration === 'month' && desktopMonthType === 'graphic' ? '$8,000 / 台' : '$4,000 / 台');
                            }
                            if (category === 'laptop') {
                              return laptopType === 'gaming' ? '$8,000 / 台' : '$4,000 / 台';
                            }
                            return '$2,000 / 台';
                          })()}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 mt-1">押金不計入總租金，於設備歸還後無息退還。</div>
                    </div>
                  </label>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 group">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative flex items-center mt-0.5">
                        <input type="checkbox" checked={customSoftware} onChange={e => setCustomSoftware(e.target.checked)} className="peer sr-only" />
                        <div className="w-5 h-5 border-2 border-slate-300 rounded-md peer-checked:bg-purple-600 peer-checked:border-purple-600 transition-colors flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
                        </div>
                      </div>
                      <div className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors flex items-center gap-2">
                        <span className="w-4 h-4 text-slate-500 flex items-center justify-center">💻</span> 客製化軟體
                      </div>
                    </label>
                    
                    {customSoftware && (
                      <div className="ml-8 sm:ml-0 flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600">費用：$</span>
                        <input 
                          type="number" 
                          min="0"
                          value={customSoftwareFee} 
                          onChange={e => setCustomSoftwareFee(parseInt(e.target.value) || 0)} 
                          className="w-24 bg-white border border-slate-300 text-slate-900 rounded-lg px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Summary Card */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-8">
            <div className="bg-slate-900 text-white rounded-3xl shadow-xl overflow-hidden">
              <div className="p-6 md:p-8">
                <h2 className="text-lg font-medium text-slate-300 mb-6 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-400" />即時報價摘要
                </h2>
                
                <div className="space-y-4 mb-8">
                  {summary.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-slate-300 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                      <span className="leading-relaxed">{detail}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-700/50">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">基本租金</span>
                    <span className="font-medium tracking-wide">${summary.baseCost.toLocaleString()}</span>
                  </div>
                  {summary.usageCost > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">預估超印費用</span>
                      <span className="font-medium tracking-wide">${summary.usageCost.toLocaleString()}</span>
                    </div>
                  )}
                  {deliverySetup && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">運送設定費 (單次)</span>
                      <span className="font-medium tracking-wide">$800</span>
                    </div>
                  )}
                  {customSoftware && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">客製化軟體費 (單次)</span>
                      <span className="font-medium tracking-wide">${customSoftwareFee.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-700/50">
                  <div className="text-sm text-slate-400 mb-1">預估總費用</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold text-blue-400">$</span>
                    <span className="text-5xl font-bold tracking-tight">{summary.totalCost.toLocaleString()}</span>
                  </div>
                </div>

                {depositReminder && (
                  <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-200/90 leading-relaxed">
                      本報價不含設備押金，交機時需另收取押金 <strong className="text-amber-400">${summary.deposit.toLocaleString()}</strong> 元。
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={handleCopy}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-5 px-6 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? '已複製報價摘要！' : '複製報價摘要'}
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
