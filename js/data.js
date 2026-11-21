/* LeadGen AI demo — seeded sample data (fictional people and businesses) */
(function () {
  const H = 3600000, D = 86400000;
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const tri = (en, ar, ur) => ({ en, ar, ur });
  const STAGES = ['new', 'contacted', 'qualified', 'proposal', 'converted'];
  const SOURCES = ['facebook', 'google', 'linkedin', 'whatsapp', 'website', 'referral'];
  const INDUSTRIES = ['realestate', 'dental', 'ecommerce', 'education', 'hospitality', 'construction', 'beauty', 'fitness', 'logistics', 'it'];
  const CITIES = ['riyadh', 'jeddah', 'dammam', 'makkah', 'khobar', 'madinah'];
  const CHANNELS = ['whatsapp', 'email', 'linkedin', 'facebook', 'sms'];

  const PEOPLE = [
    ['Ahmed Al-Shehri', 'أحمد الشهري', 'احمد الشہری'], ['Sara Khan', 'سارة خان', 'سارہ خان'], ['Bilal Ahmed', 'بلال أحمد', 'بلال احمد'], ['Fatima Noor', 'فاطمة نور', 'فاطمہ نور'],
    ['Usman Tariq', 'عثمان طارق', 'عثمان طارق'], ['Maryam Ali', 'مريم علي', 'مریم علی'], ['Khalid Al-Qahtani', 'خالد القحطاني', 'خالد القحطانی'], ['Ayesha Malik', 'عائشة مالك', 'عائشہ ملک'],
    ['Hassan Raza', 'حسن رضا', 'حسن رضا'], ['Omar Farooq', 'عمر فاروق', 'عمر فاروق'], ['Zainab Fatima', 'زينب فاطمة', 'زینب فاطمہ'], ['Ali Raza', 'علي رضا', 'علی رضا'],
    ['Noura Al-Otaibi', 'نورة العتيبي', 'نورہ العتیبی'], ['Faisal Al-Harbi', 'فيصل الحربي', 'فیصل الحربی'], ['Reem Al-Ghamdi', 'ريم الغامدي', 'ریم الغامدی'], ['Turki Al-Dosari', 'تركي الدوسري', 'ترکی الدوسری'],
    ['Hina Aslam', 'هناء أسلم', 'حنا اسلم'], ['Yousef Al-Zahrani', 'يوسف الزهراني', 'یوسف الزہرانی'], ['Lama Al-Saud', 'لمى السعود', 'لمیٰ السعود'], ['Saad Al-Mutairi', 'سعد المطيري', 'سعد المطیری'],
    ['Imran Sheikh', 'عمران شيخ', 'عمران شیخ'], ['Dana Al-Rashid', 'دانة الراشد', 'دانہ الراشد'], ['Majid Al-Anazi', 'ماجد العنزي', 'ماجد العنزی'], ['Rabia Iqbal', 'رابعة إقبال', 'رابعہ اقبال'],
    ['Abdullah Al-Subaie', 'عبدالله السبيعي', 'عبداللہ السبیعی'], ['Hafsa Javed', 'حفصة جاويد', 'حفصہ جاوید'], ['Nasser Al-Shamrani', 'ناصر الشمراني', 'ناصر الشمرانی'], ['Amna Siddiqui', 'آمنة صديقي', 'آمنہ صدیقی'],
    ['Badr Al-Juhani', 'بدر الجهني', 'بدر الجہنی'], ['Sana Mirza', 'سناء ميرزا', 'ثناء مرزا'], ['Waleed Al-Malki', 'وليد المالكي', 'ولید المالکی'], ['Kiran Abbas', 'كيران عباس', 'کرن عباس'],
  ];
  const COMPANIES = {
    realestate: [['Al Noor Real Estate', 'النور العقارية', 'النور رئیل اسٹیٹ'], ['Future Homes', 'منازل المستقبل', 'فیوچر ہومز'], ['Red Sea Properties', 'عقارات البحر الأحمر', 'ریڈ سی پراپرٹیز'], ['Najd Realty', 'نجد العقارية', 'نجد ریئلٹی']],
    dental: [['Rehman Dental Clinic', 'عيادة الرحمن لطب الأسنان', 'رحمان ڈینٹل کلینک'], ['Smile Care Dental', 'سمايل كير للأسنان', 'اسمائل کیئر ڈینٹل'], ['Pearl Dental Center', 'مركز اللؤلؤة للأسنان', 'پرل ڈینٹل سینٹر']],
    ecommerce: [['Souq Style Store', 'متجر سوق ستايل', 'سوق اسٹائل اسٹور'], ['Oud & Musk Online', 'عود ومسك أونلاين', 'عود اینڈ مسک آن لائن'], ['GadgetBox KSA', 'جادجت بوكس', 'گیجٹ باکس']],
    education: [['Bright Minds Academy', 'أكاديمية العقول المشرقة', 'برائٹ مائنڈز اکیڈمی'], ['Riyadh Language Center', 'مركز الرياض للغات', 'ریاض لینگویج سینٹر'], ['Future Skills Institute', 'معهد مهارات المستقبل', 'فیوچر اسکلز انسٹیٹیوٹ']],
    hospitality: [['Hijaz Boutique Hotel', 'فندق الحجاز بوتيك', 'حجاز بوتیک ہوٹل'], ['Desert Rose Resort', 'منتجع وردة الصحراء', 'ڈیزرٹ روز ریزورٹ'], ['Corniche Café', 'مقهى الكورنيش', 'کورنیش کیفے']],
    construction: [['Al Bina Contracting', 'البناء للمقاولات', 'البناء کنٹریکٹنگ'], ['Steel Line Projects', 'ستيل لاين للمشاريع', 'اسٹیل لائن پراجیکٹس'], ['Granite Build Co.', 'جرانيت للبناء', 'گرینائٹ بلڈ کمپنی']],
    beauty: [['Glow Beauty Salon', 'صالون جلو للتجميل', 'گلو بیوٹی سیلون'], ['Lavender Spa', 'لافندر سبا', 'لیونڈر اسپا'], ['Noor Skin Clinic', 'عيادة نور للبشرة', 'نور اسکن کلینک']],
    fitness: [['PowerFit Gym', 'نادي باور فِت', 'پاور فٹ جم'], ['Yoga Nest Studio', 'استوديو يوغا نست', 'یوگا نیسٹ اسٹوڈیو'], ['Coastal CrossFit', 'كروس فِت الساحل', 'کوسٹل کراس فٹ']],
    logistics: [['Swift Cargo KSA', 'سويفت كارجو', 'سوئفٹ کارگو'], ['Gulf Fleet Logistics', 'أسطول الخليج للخدمات اللوجستية', 'گلف فلیٹ لاجسٹکس'], ['LastMile Express', 'لاست مايل إكسبرس', 'لاسٹ مائل ایکسپریس']],
    it: [['Bright Tech', 'برايت تك', 'برائٹ ٹیک'], ['CloudNest Solutions', 'كلاود نست للحلول', 'کلاؤڈ نیسٹ سولوشنز'], ['ByteBridge IT', 'بايت بريدج', 'بائٹ برج آئی ٹی']],
  };
  const NEEDS = ['crm', 'ads', 'whatsapp', 'website', 'leads', 'social', 'seo', 'voice'];

  function seed() {
    const R = rng(20261122), now = Date.now(), r = (a, b) => a + Math.floor(R() * (b - a + 1)), pick = a => a[Math.floor(R() * a.length)];
    const team = [
      { id: 't1', name: tri('Hamza Ali', 'حمزة علي', 'حمزہ علی'), role: 'sales' }, { id: 't2', name: tri('Lina Haddad', 'لينا حداد', 'لینا حداد'), role: 'sdr' },
      { id: 't3', name: tri('Yousef Khan', 'يوسف خان', 'یوسف خان'), role: 'sales' }, { id: 't4', name: tri('Maha Al-Saud', 'مها السعود', 'مہا السعود'), role: 'sdr' },
    ];
    // stage distribution roughly like a real funnel
    const plan = [].concat(Array(12).fill('new'), Array(10).fill('contacted'), Array(8).fill('qualified'), Array(6).fill('proposal'), Array(6).fill('converted'));
    const used = {};
    const leads = plan.map((stage, i) => {
      const ind = INDUSTRIES[i % INDUSTRIES.length], list = COMPANIES[ind]; let c = list[(used[ind] = (used[ind] || 0) + 1) % list.length];
      const p = PEOPLE[i % PEOPLE.length];
      const base = { new: 35, contacted: 50, qualified: 68, proposal: 78, converted: 90 }[stage];
      const ago = { new: r(0, 30) * 60000 * (i % 3 ? 60 : 1), contacted: r(1, 30) * H, qualified: r(3, 72) * H, proposal: r(1, 6) * D, converted: r(2, 20) * D }[stage];
      return { id: 'L' + (101 + i), name: tri(...p), company: tri(...c), industry: ind, city: CITIES[i % 5 === 4 ? 2 : i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : r(0, 5)], source: SOURCES[[0, 0, 1, 1, 2, 3, 4, 5, 0, 1, 2, 3][i % 12]],
        stage, score: Math.min(98, base + r(-8, 9)), value: r(4, 40) * 1000, need: NEEDS[i % NEEDS.length], owner: team[i % 4].id,
        phone: '+966 5' + r(0, 9) + ' ' + r(100, 999) + ' ' + r(1000, 9999), email: p[0].toLowerCase().replace(/[^a-z]+/g, '.') + '@sample.demo', created: now - ago - r(0, 5) * D * (stage === 'new' ? 0 : 1), touched: now - ago };
    });
    // pin a few to mirror the screenshot's first cards
    const fix = (i, ind, ci, ci2) => { leads[i].industry = ind; leads[i].company = tri(...COMPANIES[ind][ci2 || 0]); leads[i].city = ci; };
    fix(0, 'realestate', 'riyadh'); fix(1, 'dental', 'jeddah', 0); leads[1].name = tri(...PEOPLE[1]); fix(2, 'ecommerce', 'jeddah');
    const campaigns = [
      { id: 'C1', name: tri('Ramadan Real Estate Leads', 'عملاء عقارات رمضان', 'رمضان رئیل اسٹیٹ لیڈز'), channel: 'whatsapp', status: 'active', sent: 420, opened: 388, replied: 96, leads: 41, start: now - 18 * D },
      { id: 'C2', name: tri('Clinic Owners Outreach', 'التواصل مع أصحاب العيادات', 'کلینک مالکان آؤٹ ریچ'), channel: 'email', status: 'active', sent: 1250, opened: 540, replied: 62, leads: 28, start: now - 25 * D },
      { id: 'C3', name: tri('B2B Decision Makers', 'صناع القرار B2B', 'B2B فیصلہ ساز'), channel: 'linkedin', status: 'active', sent: 300, opened: 210, replied: 44, leads: 19, start: now - 12 * D },
      { id: 'C4', name: tri('Gym Free Trial Ads', 'إعلانات تجربة النادي المجانية', 'جم فری ٹرائل ایڈز'), channel: 'facebook', status: 'paused', sent: 860, opened: 610, replied: 73, leads: 33, start: now - 30 * D },
      { id: 'C5', name: tri('Appointment Reminders', 'تذكير المواعيد', 'اپائنٹمنٹ یاد دہانی'), channel: 'sms', status: 'active', sent: 520, opened: 505, replied: 38, leads: 9, start: now - 8 * D },
      { id: 'C6', name: tri('E-commerce Cart Recovery', 'استرجاع سلات المتاجر', 'ای کامرس کارٹ ریکوری'), channel: 'email', status: 'draft', sent: 0, opened: 0, replied: 0, leads: 0, start: now },
    ];
    const tasks = [
      { id: 'k1', type: 'call', lid: leads[30].id, due: now + 2 * H, done: false }, { id: 'k2', type: 'contract', lid: leads[37].id, due: now + 6 * H, done: false },
      { id: 'k3', type: 'follow', lid: null, n: 12, due: now + 26 * H, done: false }, { id: 'k4', type: 'review', lid: null, due: now + 30 * H, done: false },
      { id: 'k5', type: 'meeting', lid: null, due: now + 50 * H, done: false }, { id: 'k6', type: 'call', lid: leads[24].id, due: now + 52 * H, done: false },
      { id: 'k7', type: 'proposal', lid: leads[31].id, due: now + 74 * H, done: false },
    ];
    const appts = [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const l = leads[[22, 24, 26, 30, 31, 33, 20, 28][i]]; const d = new Date(now + (i - 2) * D); d.setHours(10 + (i * 2) % 7, i % 2 ? 30 : 0, 0, 0); return { id: 'a' + i, lid: l.id, at: d.getTime(), type: i % 3 ? 'demo' : 'call', status: i < 2 ? 'done' : 'booked' }; });
    const activity = [
      { k: 'act.found', v: { n: 6, ch: 'linkedin' }, at: now - 5 * 60000, ic: 'linkedin' }, { k: 'act.follow', v: { n: 18 }, at: now - 32 * 60000, ic: 'mail' },
      { k: 'act.booked', v: { n: 3 }, at: now - H, ic: 'whatsapp' }, { k: 'act.client', v: { l: leads[36].id }, at: now - 2 * H, ic: 'user' },
    ];
    const chats = []; // AI assistant history
    return { v: 1, seededAt: now, team, leads, campaigns, tasks, appts, activity, notifs: activity.map(a => Object.assign({ read: false }, a)), chats, seq: 101 + leads.length };
  }
  window.SEED = { seed, STAGES, SOURCES, INDUSTRIES, CITIES, CHANNELS, NEEDS, COMPANIES };
})();
