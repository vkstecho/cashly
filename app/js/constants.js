/* Cashly – constants.js */
var BASE_CATS=[
{id:"food",l:"Food & Drinks",i:"🍔",c:"#FF6B6B",t:"e",g:"need"},
{id:"groceries",l:"Groceries",i:"🛒",c:"#4CAF50",t:"e",g:"need"},
{id:"vegetables",l:"Vegetables & Fruits",i:"🥬",c:"#66BB6A",t:"e",g:"need"},
{id:"bills",l:"Bills & Utilities",i:"📄",c:"#FF9800",t:"e",g:"need"},
{id:"transport",l:"Transport & Travel",i:"🚗",c:"#9C27B0",t:"e",g:"need"},
{id:"fuel",l:"Fuel",i:"⛽",c:"#795548",t:"e",g:"need"},
{id:"health",l:"Health & Medical",i:"💊",c:"#00BCD4",t:"e",g:"need"},
{id:"rent",l:"Rent & Housing",i:"🏠",c:"#E64A19",t:"e",g:"need"},
{id:"dailycare",l:"Daily Care",i:"🧴",c:"#8D6E63",t:"e",g:"need"},
{id:"insurance",l:"Insurance",i:"🛡️",c:"#37474F",t:"e",g:"need"},
{id:"shopping",l:"Shopping",i:"🛍️",c:"#2196F3",t:"e",g:"want"},
{id:"entertainment",l:"Entertainment",i:"🎬",c:"#E91E63",t:"e",g:"want"},
{id:"education",l:"Education",i:"📚",c:"#FFC107",t:"e",g:"want"},
{id:"other",l:"Other",i:"📦",c:"#78909C",t:"e",g:"want"},
{id:"investment",l:"Investment",i:"📈",c:"#558B2F",t:"e",g:"savings"},
{id:"salary",l:"Salary",i:"💰",c:"#2E7D32",t:"i",g:"income"},
{id:"family",l:"From Friends & Family",i:"👥",c:"#16A34A",t:"i",g:"income"}
];
var CATS=BASE_CATS.slice();
var AXIO_MAP={
"FOOD & DRINKS":"food","VEGETABLES":"vegetables","FRUITS":"vegetables",
"GROCERIES":"groceries","SHOPPING":"shopping","BILLS":"bills",
"TRANSPORT":"transport","TRAVEL":"transport","FUEL":"fuel",
"ENTERTAINMENT":"entertainment","HEALTH":"health","EDUCATION":"education",
"RENT":"rent","HOME":"rent","DAILY CARE":"dailycare","BABY CARE":"dailycare",
"INVESTMENT":"investment","INSURANCE":"insurance","OTHER":"other",
"LEN DEN":"other","CREDIT":"family","SALARY":"salary",
"REFUND":"family","BILL PAYMENT":"other","TRANSFER":"other"
};
var MO=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var MOFULL=["January","February","March","April","May","June","July","August","September","October","November","December"];
function gC(id){for(var i=0;i<CATS.length;i++)if(CATS[i].id===id)return CATS[i];return BASE_CATS.find(function(category){return category.id==="other"})}
function iCats(){return CATS.filter(function(c){return c.t==="i"})}
function eCats(){return CATS.filter(function(c){return c.t==="e"})}
var CURRENCIES={INR:{s:"\u20B9",n:"Indian Rupee",code:"INR"},USD:{s:"$",n:"US Dollar",code:"USD"},EUR:{s:"\u20AC",n:"Euro",code:"EUR"},GBP:{s:"\u00A3",n:"Pound",code:"GBP"},AED:{s:"AED ",n:"UAE Dirham",code:"AED"},SGD:{s:"S$",n:"Singapore $",code:"SGD"}};
function getCurrency(){return localStorage.getItem("mf_curr")||"INR"}
function setCurrency(c){localStorage.setItem("mf_curr",c);toast("Currency: "+CURRENCIES[c].n);rH();rC();rM()}
function getCurrSym(){return CURRENCIES[getCurrency()].s}
function fm(n){var s=getCurrSym();var a=Math.abs(n);return a>=1e5?s+(a/1e5).toFixed(1)+"L":a>=1e3?s+(a/1e3).toFixed(1)+"K":s+a.toLocaleString("en-IN")}
function fF(n){return getCurrSym()+Math.abs(Number(n)||0).toLocaleString("en-IN",{maximumFractionDigits:2})}
function financePaise(value){
 var amount=Number(value);
 var paise=Math.round(Math.abs(amount)*100);
 return Number.isSafeInteger(paise)?Math.sign(amount)*paise:0;
}
function safeToSpend(budget,expense,date){
 var remaining=financePaise(budget)-financePaise(expense);
 var days=new Date(date.getFullYear(),date.getMonth()+1,0).getDate()-date.getDate()+1;
 return Math.max(0,Math.floor(remaining/days))/100;
}
function fP(n){var c=getCurrency();var sym=c==="INR"?"Rs. ":CURRENCIES[c].s;var loc=c==="INR"?"en-IN":"en-US";return sym+Math.round(Math.abs(n||0)).toLocaleString(loc)}
function genId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function localDateKey(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function tdy(){return localDateKey(new Date())}
function tMo(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")}
function esc(s){var d=document.createElement("div");d.textContent=s;return d.innerHTML.replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function $(id){return document.getElementById(id)}



// Indian bank / wallet logo pack (SVG marks + brand colors)
var BANK_LOGOS = {
  "hdfc": {name:"HDFC", color:"#004C8F", bg:"#E8F1FA", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#004C8F"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="11" font-weight="700" font-family="Arial">HDFC</text></svg>'},
  "hdfc credit": {name:"HDFC Credit", color:"#004C8F", bg:"#E8F1FA", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#004C8F"/><text x="20" y="18" text-anchor="middle" fill="#fff" font-size="8" font-weight="700" font-family="Arial">HDFC</text><text x="20" y="30" text-anchor="middle" fill="#FFD700" font-size="8" font-weight="700" font-family="Arial">CARD</text></svg>'},
  "sbi": {name:"SBI", color:"#00B5E2", bg:"#E6F7FC", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#00B5E2"/><circle cx="20" cy="20" r="10" fill="none" stroke="#fff" stroke-width="2.5"/><circle cx="20" cy="20" r="3" fill="#fff"/></svg>'},
  "icici": {name:"ICICI", color:"#F58220", bg:"#FEF0E6", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#F58220"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="10" font-weight="700" font-family="Arial">ICICI</text></svg>'},
  "icici credit": {name:"ICICI Credit", color:"#F58220", bg:"#FEF0E6", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#F58220"/><text x="20" y="18" text-anchor="middle" fill="#fff" font-size="8" font-weight="700" font-family="Arial">ICICI</text><text x="20" y="30" text-anchor="middle" fill="#fff" font-size="8" font-weight="700" font-family="Arial">CARD</text></svg>'},
  "axis": {name:"Axis", color:"#97144D", bg:"#F9E8EF", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#97144D"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="11" font-weight="700" font-family="Arial">AXIS</text></svg>'},
  "kotak": {name:"Kotak", color:"#ED1C24", bg:"#FDE8E9", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#ED1C24"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="10" font-weight="700" font-family="Arial">KOTAK</text></svg>'},
  "au bank": {name:"AU Bank", color:"#6B2D8B", bg:"#F3EAF7", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#6B2D8B"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="12" font-weight="700" font-family="Arial">AU</text></svg>'},
  "yes bank": {name:"Yes Bank", color:"#00518F", bg:"#E6EEF5", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#00518F"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="11" font-weight="700" font-family="Arial">YES</text></svg>'},
  "rbl": {name:"RBL", color:"#1B3A6B", bg:"#E8EEF7", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#1B3A6B"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="12" font-weight="700" font-family="Arial">RBL</text></svg>'},
  "rblbank": {name:"RBL", color:"#1B3A6B", bg:"#E8EEF7", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#1B3A6B"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="12" font-weight="700" font-family="Arial">RBL</text></svg>'},
  "equitas": {name:"Equitas", color:"#E31837", bg:"#FCE8EB", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#E31837"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="9" font-weight="700" font-family="Arial">EQUITAS</text></svg>'},
  "pnb": {name:"PNB", color:"#6B1E3A", bg:"#F5E8ED", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#6B1E3A"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="12" font-weight="700" font-family="Arial">PNB</text></svg>'},
  "bob": {name:"Bank of Baroda", color:"#F15A22", bg:"#FEF0E9", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#F15A22"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="11" font-weight="700" font-family="Arial">BoB</text></svg>'},
  "canara": {name:"Canara", color:"#00AEEF", bg:"#E6F7FD", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#00AEEF"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="9" font-weight="700" font-family="Arial">CANARA</text></svg>'},
  "union": {name:"Union Bank", color:"#E30613", bg:"#FCE6E8", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#E30613"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="9" font-weight="700" font-family="Arial">UNION</text></svg>'},
  "idfc": {name:"IDFC", color:"#9B1D20", bg:"#F8E8E9", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#9B1D20"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="11" font-weight="700" font-family="Arial">IDFC</text></svg>'},
  "indusind": {name:"IndusInd", color:"#6C1D45", bg:"#F5E8EF", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#6C1D45"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="9" font-weight="700" font-family="Arial">INDUS</text></svg>'},
  "paytm": {name:"Paytm", color:"#00BAF2", bg:"#E6F7FD", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#00BAF2"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="10" font-weight="700" font-family="Arial">paytm</text></svg>'},
  "phonepe": {name:"PhonePe", color:"#5F259F", bg:"#F0E9F7", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#5F259F"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="9" font-weight="700" font-family="Arial">PhonePe</text></svg>'},
  "gpay": {name:"Google Pay", color:"#4285F4", bg:"#E8F0FE", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#fff" stroke="#E5E7EB"/><text x="20" y="26" text-anchor="middle" fill="#4285F4" font-size="11" font-weight="700" font-family="Arial">GPay</text></svg>'},
  "google pay": {name:"Google Pay", color:"#4285F4", bg:"#E8F0FE", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#fff" stroke="#E5E7EB"/><text x="20" y="26" text-anchor="middle" fill="#4285F4" font-size="11" font-weight="700" font-family="Arial">GPay</text></svg>'},
  "amazon pay": {name:"Amazon Pay", color:"#FF9900", bg:"#FFF6E6", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#232F3E"/><text x="20" y="26" text-anchor="middle" fill="#FF9900" font-size="9" font-weight="700" font-family="Arial">amazon</text></svg>'},
  "amazon": {name:"Amazon Pay", color:"#FF9900", bg:"#FFF6E6", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#232F3E"/><text x="20" y="26" text-anchor="middle" fill="#FF9900" font-size="9" font-weight="700" font-family="Arial">amazon</text></svg>'},
  "mobikwik": {name:"MobiKwik", color:"#E91E63", bg:"#FCE4EC", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#E91E63"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="8" font-weight="700" font-family="Arial">MobiKwik</text></svg>'},
  "ola money": {name:"Ola Money", color:"#000", bg:"#F0F0F0", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#000"/><text x="20" y="26" text-anchor="middle" fill="#00E676" font-size="10" font-weight="700" font-family="Arial">ola</text></svg>'},
  "cash": {name:"Cash", color:"#2E7D32", bg:"#E8F5E9", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#2E7D32"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="14">💵</text></svg>'},
  "bank": {name:"Bank", color:"#1565C0", bg:"#E3F2FD", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#1565C0"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="14">🏦</text></svg>'},
  "credit": {name:"Credit Card", color:"#E65100", bg:"#FFF3E0", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#E65100"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="14">💳</text></svg>'},
  "wallet": {name:"Wallet", color:"#6A1B9A", bg:"#F3E5F5", svg:'<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#6A1B9A"/><text x="20" y="26" text-anchor="middle" fill="#fff" font-size="14">👛</text></svg>'}
};
function bankLogo(name){
  if(!name) return BANK_LOGOS.bank;
  var key = String(name).toLowerCase().trim();
  // direct match
  if(BANK_LOGOS[key]) return BANK_LOGOS[key];
  // partial match
  for(var k in BANK_LOGOS){
    if(key.indexOf(k)!==-1 || k.indexOf(key)!==-1) return BANK_LOGOS[k];
  }
  // type fallbacks
  if(key.indexOf("credit")!==-1 || key.indexOf("card")!==-1) return BANK_LOGOS.credit;
  if(key.indexOf("wallet")!==-1 || key.indexOf("pay")!==-1) return BANK_LOGOS.wallet;
  if(key.indexOf("cash")!==-1) return BANK_LOGOS.cash;
  return BANK_LOGOS.bank;
}
function bankLogoHtml(name, size){
  size = size || 36;
  var b = bankLogo(name);
  return '<div class="bank-logo" style="width:'+size+'px;height:'+size+'px;border-radius:10px;overflow:hidden;flex-shrink:0;background:'+b.bg+'">'+b.svg.replace('viewBox="0 0 40 40"','viewBox="0 0 40 40" width="'+size+'" height="'+size+'"')+'</div>';
}


// Map center cities (lat, lon, bbox delta ~0.15)
var MAP_CITIES = {
  "delhi":        {name:"Delhi NCR", lat:28.6139, lon:77.2090},
  "mumbai":       {name:"Mumbai", lat:19.0760, lon:72.8777},
  "bangalore":    {name:"Bangalore", lat:12.9716, lon:77.5946},
  "bengaluru":    {name:"Bangalore", lat:12.9716, lon:77.5946},
  "hyderabad":    {name:"Hyderabad", lat:17.3850, lon:78.4867},
  "chennai":      {name:"Chennai", lat:13.0827, lon:80.2707},
  "kolkata":      {name:"Kolkata", lat:22.5726, lon:88.3639},
  "pune":         {name:"Pune", lat:18.5204, lon:73.8567},
  "ahmedabad":    {name:"Ahmedabad", lat:23.0225, lon:72.5714},
  "jaipur":       {name:"Jaipur", lat:26.9124, lon:75.7873},
  "lucknow":      {name:"Lucknow", lat:26.8467, lon:80.9462},
  "chandigarh":   {name:"Chandigarh", lat:30.7333, lon:76.7794},
  "kochi":        {name:"Kochi", lat:9.9312, lon:76.2673},
  "coimbatore":   {name:"Coimbatore", lat:11.0168, lon:76.9558},
  "indore":       {name:"Indore", lat:22.7196, lon:75.8577},
  "bhopal":       {name:"Bhopal", lat:23.2599, lon:77.4126},
  "patna":        {name:"Patna", lat:25.5941, lon:85.1376},
  "bhubaneswar":  {name:"Bhubaneswar", lat:20.2961, lon:85.8245},
  "guwahati":     {name:"Guwahati", lat:26.1445, lon:91.7362},
  "thiruvananthapuram": {name:"Thiruvananthapuram", lat:8.5241, lon:76.9366},
  "visakhapatnam":{name:"Visakhapatnam", lat:17.6868, lon:83.2185},
  "surat":        {name:"Surat", lat:21.1702, lon:72.8311},
  "nagpur":       {name:"Nagpur", lat:21.1458, lon:79.0882},
  "vadodara":     {name:"Vadodara", lat:22.3072, lon:73.1812},
  "ludhiana":     {name:"Ludhiana", lat:30.9010, lon:75.8573},
  "agra":         {name:"Agra", lat:27.1767, lon:78.0081},
  "varanasi":     {name:"Varanasi", lat:25.3176, lon:82.9739},
  "dehradun":     {name:"Dehradun", lat:30.3165, lon:78.0322},
  "mysore":       {name:"Mysore", lat:12.2958, lon:76.6394},
  "mysuru":       {name:"Mysore", lat:12.2958, lon:76.6394},
  "goa":          {name:"Goa", lat:15.2993, lon:74.1240},
  "ranchi":       {name:"Ranchi", lat:23.3441, lon:85.3096},
  "raipur":       {name:"Raipur", lat:21.2514, lon:81.6296},
  "amritsar":     {name:"Amritsar", lat:31.6340, lon:74.8723},
  "jodhpur":      {name:"Jodhpur", lat:26.2389, lon:73.0243},
  "madurai":      {name:"Madurai", lat:9.9252, lon:78.1198},
  "nashik":       {name:"Nashik", lat:19.9975, lon:73.7898},
  "kanpur":       {name:"Kanpur", lat:26.4499, lon:80.3319},
  "faridabad":    {name:"Faridabad", lat:28.4089, lon:77.3178},
  "ghaziabad":    {name:"Ghaziabad", lat:28.6692, lon:77.4538},
  "noida":        {name:"Noida", lat:28.5355, lon:77.3910},
  "gurgaon":      {name:"Gurgaon", lat:28.4595, lon:77.0266},
  "gurugram":     {name:"Gurugram", lat:28.4595, lon:77.0266}
};
function getMapCity(){
  try{
    var k = localStorage.getItem("cashly_map_city") || "delhi";
    return MAP_CITIES[k] || MAP_CITIES.delhi;
  }catch(e){ return MAP_CITIES.delhi; }
}
function setMapCity(key){
  if(!MAP_CITIES[key]) return false;
  localStorage.setItem("cashly_map_city", key);
  return true;
}
function mapEmbedUrl(city){
  city = city || getMapCity();
  var d = 0.18;
  var minLon = (city.lon - d).toFixed(4);
  var minLat = (city.lat - d).toFixed(4);
  var maxLon = (city.lon + d).toFixed(4);
  var maxLat = (city.lat + d).toFixed(4);
  return "https://www.openstreetmap.org/export/embed.html?bbox="+minLon+"%2C"+minLat+"%2C"+maxLon+"%2C"+maxLat+"&layer=mapnik&marker="+city.lat+"%2C"+city.lon;
}
function mapLinkUrl(city){
  city = city || getMapCity();
  return "https://www.openstreetmap.org/#map=12/"+city.lat+"/"+city.lon;
}
