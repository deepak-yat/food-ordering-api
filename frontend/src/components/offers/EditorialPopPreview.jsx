import React, { useEffect, useState } from "react";
import EditorialPopTemplate from "./EditorialPopTemplate";
import "../../styles/EditorialPopPreview.css";

const INITIAL_OFFER = {
  shop_name: "BURNO",
  offer_title: "A FEAST TO REMEMBER",
  description: "Discover irresistible flavours at an unforgettable price.",
  discount_value: "25",
  image_url: "",
};

const INITIAL_CONFIG = {
  background_color: "#101010", accent_color: "#FF4A26", text_color: "#FFF7ED",
  paper_color: "#FFF8EF", reveal_color: "#FF8A18", brand_symbol: "🔥",
  brand_subtitle: "RESTAURANT", tagline: "GOOD FOOD\nHAPPIER PEOPLE",
  badge_heading: "GET", badge_footer: "OFF", badge_text: "LIMITED TIME OFFER",
  side_note: "ON SELECTED ITEMS", feature_one: "DELICIOUS FLAVOURS",
  feature_two: "FRESH INGREDIENTS", feature_three: "GREAT TIMES",
  image_x: 50, image_y: 50, image_zoom: 100, headline_size: 48,
  restaurant_size: 56, discount_size: 34, show_tagline: true,
  show_side_note: true, show_features: true, show_brand_symbol: true,
  show_hanging_badge: true,
};

const PALETTES = [
  { name:"Fire", background_color:"#101010", accent_color:"#FF4A26", text_color:"#FFF7ED", paper_color:"#FFF8EF", reveal_color:"#FF8A18" },
  { name:"Midnight Gold", background_color:"#121212", accent_color:"#E0AF42", text_color:"#FFF8E9", paper_color:"#FFF4DC", reveal_color:"#D68B22" },
  { name:"Forest", background_color:"#10231C", accent_color:"#56A66C", text_color:"#F4F8E9", paper_color:"#F9F6E9", reveal_color:"#B7C96A" },
  { name:"Berry", background_color:"#21101C", accent_color:"#F24C76", text_color:"#FFF1F5", paper_color:"#FFF4F5", reveal_color:"#B82D5C" },
  { name:"Ocean", background_color:"#0D1C2B", accent_color:"#42B7D7", text_color:"#F0F8FF", paper_color:"#F7FBFF", reveal_color:"#197FBA" },
];

export default function EditorialPopPreview() {
  const [offer, setOffer] = useState(INITIAL_OFFER);
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => () => {
    if (uploadedImageUrl.startsWith("blob:")) URL.revokeObjectURL(uploadedImageUrl);
  }, [uploadedImageUrl]);

  const updateOffer = (field, value) => setOffer((old) => ({ ...old, [field]: value }));
  const updateConfig = (field, value) => setConfig((old) => ({ ...old, [field]: value }));

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      window.alert("Please choose a valid image file.");
      event.target.value = "";
      return;
    }
    if (uploadedImageUrl.startsWith("blob:")) URL.revokeObjectURL(uploadedImageUrl);
    const url = URL.createObjectURL(file);
    setUploadedImageUrl(url);
    setImageFileName(file.name);
    updateOffer("image_url", url);
  };

  const applyPalette = (palette) => setConfig((old) => ({
    ...old, background_color:palette.background_color, accent_color:palette.accent_color,
    text_color:palette.text_color, paper_color:palette.paper_color, reveal_color:palette.reveal_color,
  }));

  const resetEditor = () => {
    setOffer({ ...INITIAL_OFFER, image_url: uploadedImageUrl || "" });
    setConfig(INITIAL_CONFIG);
  };

  const downloadPreview = async () => {
    setExporting(true);
    try {
      const card = document.querySelector(".editorial-pop--torn");
      if (!card) throw new Error("Offer card not found");
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(card, {
        scale: 2, useCORS: true, backgroundColor: config.background_color, logging: false,
      });
      const link = document.createElement("a");
      link.download = "foodly-editorial-pop.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Editorial Pop export failed:", error);
      window.alert("Unable to export the offer. Check the browser console.");
    } finally {
      setExporting(false);
    }
  };

  const textField = (label, field, value, setter, options = {}) => (
    <label className="ep-field" key={field}>
      <span>{label}</span>
      {options.multiline
        ? <textarea rows={3} maxLength={options.maxLength || 200} value={value ?? ""} onChange={(e) => setter(field,e.target.value)} placeholder={label} />
        : <input type="text" maxLength={options.maxLength || 100} value={value ?? ""} onChange={(e) => setter(field,e.target.value)} placeholder={label} />}
    </label>
  );

  const colorField = (label, field) => (
    <label className="ep-color-field" key={field}>
      <span>{label}</span><div><input type="color" value={config[field]} onChange={(e) => updateConfig(field,e.target.value)} /><code>{config[field]}</code></div>
    </label>
  );

  const toggle = (label, field) => (
    <label className="ep-toggle" key={field}><span>{label}</span><input type="checkbox" checked={Boolean(config[field])} onChange={(e) => updateConfig(field,e.target.checked)} /></label>
  );

  const range = (label, field, min, max, step = 1, suffix = "") => (
    <div className="ep-range" key={field}>
      <div><label htmlFor={`ep-${field}`}>{label}</label><output>{config[field]}{suffix}</output></div>
      <input id={`ep-${field}`} type="range" min={min} max={max} step={step} value={config[field]} onChange={(e) => updateConfig(field,Number(e.target.value))} />
    </div>
  );

  return (
    <main className="editorial-preview-page editorial-preview-page--torn">
      <header className="ep-header">
        <div><span className="ep-kicker">FOODLY DESIGN STUDIO / TEMPLATE 04</span><h1>Editorial Pop</h1><p>A dramatic torn-paper reveal for restaurant offers.</p></div>
        <span className="ep-edition">EP—04</span>
      </header>

      <div className="ep-workspace">
        <section className="ep-canvas">
          <div className="ep-canvas-label"><span>LIVE PREVIEW</span><span>CHANGES UPDATE IN REAL TIME</span></div>
          <div className="ep-card-wrap"><EditorialPopTemplate offer={offer} config={config} /></div>
          <div className="ep-canvas-label ep-canvas-footer"><span>EDITORIAL POP</span><span>FOODLY OFFER COLLECTION</span></div>
        </section>

        <aside className="ep-editor">
          <div className="ep-editor-heading"><div><span className="ep-kicker">CUSTOMISATION</span><h2>Make it yours</h2></div><button type="button" onClick={resetEditor}>Reset</button></div>

          <section className="ep-section"><h3>01 / Restaurant & offer</h3>
            {textField("Restaurant name","shop_name",offer.shop_name,updateOffer)}
            {textField("Brand subtitle","brand_subtitle",config.brand_subtitle,updateConfig)}
            {textField("Offer headline","offer_title",offer.offer_title,updateOffer,{maxLength:100})}
            {textField("Description","description",offer.description,updateOffer,{multiline:true,maxLength:240})}
            <label className="ep-field"><span>Discount percentage</span><div className="ep-suffix"><input type="number" min="0" max="100" value={String(offer.discount_value).replace("%","")} onChange={(e)=>updateOffer("discount_value",e.target.value)} /><b>% OFF</b></div></label>
            {textField("Brand symbol / emoji","brand_symbol",config.brand_symbol,updateConfig,{maxLength:8})}
            {textField("Tagline (new line creates another line)","tagline",config.tagline,updateConfig,{multiline:true,maxLength:100})}
          </section>

          <section className="ep-section"><h3>02 / Food photography</h3>
            <label className="ep-upload"><input type="file" accept="image/*" onChange={handleImageUpload}/><span>＋</span><div><b>{imageFileName ? "Change image" : "Upload food image"}</b><small>{imageFileName || "JPG, PNG or WebP"}</small></div></label>
            {range("Image zoom","image_zoom",50,180,5,"%")}
            {range("Horizontal position","image_x",0,100,1,"%")}
            {range("Vertical position","image_y",0,100,1,"%")}
          </section>

          <section className="ep-section"><h3>03 / Hanging discount badge</h3>
            {textField("Badge heading","badge_heading",config.badge_heading,updateConfig)}
            {textField("Badge footer","badge_footer",config.badge_footer,updateConfig)}
            {textField("Small offer label","badge_text",config.badge_text,updateConfig)}
            {range("Discount number size","discount_size",18,52,1,"px")}
            {toggle("Show hanging badge","show_hanging_badge")}
          </section>

          <section className="ep-section"><h3>04 / Side messages</h3>
            {textField("Right-side message","side_note",config.side_note,updateConfig)}
            {toggle("Show tagline","show_tagline")}{toggle("Show side message","show_side_note")}{toggle("Show brand symbol","show_brand_symbol")}
          </section>

          <section className="ep-section"><h3>05 / Bottom feature strip</h3>
            {textField("Feature one","feature_one",config.feature_one,updateConfig)}
            {textField("Feature two","feature_two",config.feature_two,updateConfig)}
            {textField("Feature three","feature_three",config.feature_three,updateConfig)}
            {toggle("Show feature strip","show_features")}
          </section>

          <section className="ep-section"><h3>06 / Colour direction</h3>
            <div className="ep-palettes">{PALETTES.map((p)=><button type="button" key={p.name} onClick={()=>applyPalette(p)} title={p.name}><i style={{background:p.background_color}}/><i style={{background:p.accent_color}}/><i style={{background:p.paper_color}}/><small>{p.name}</small></button>)}</div>
            <div className="ep-colors">{colorField("Background","background_color")}{colorField("Accent","accent_color")}{colorField("Text","text_color")}{colorField("Paper","paper_color")}{colorField("Reveal","reveal_color")}</div>
          </section>

          <section className="ep-section"><h3>07 / Typography</h3>
            {range("Headline size","headline_size",24,72,2,"px")}
            {range("Restaurant name size","restaurant_size",28,76,2,"px")}
          </section>

          <button className="ep-export" type="button" disabled={exporting} onClick={downloadPreview}>{exporting ? "Exporting…" : "Export offer as PNG"} <span>↗</span></button>
          <p className="ep-note">Preview settings are local to this page. Uploaded images use temporary browser URLs; permanent image uploads and database saving need backend integration.</p>
        </aside>
      </div>
    </main>
  );
}
