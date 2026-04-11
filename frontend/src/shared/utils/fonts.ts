export interface FontDef {
  name: string;
  family: string;
  category: string;
}

export const FONTS: FontDef[] = [
  // Sans-serif
  { name: "Arial",             family: "Arial, sans-serif",               category: "Sans-serif" },
  { name: "Arial Black",       family: "'Arial Black', sans-serif",        category: "Sans-serif" },
  { name: "Verdana",           family: "Verdana, sans-serif",              category: "Sans-serif" },
  { name: "Tahoma",            family: "Tahoma, sans-serif",               category: "Sans-serif" },
  { name: "Trebuchet MS",      family: "'Trebuchet MS', sans-serif",        category: "Sans-serif" },
  { name: "Helvetica",         family: "Helvetica, sans-serif",            category: "Sans-serif" },
  { name: "Roboto",            family: "'Roboto', sans-serif",             category: "Sans-serif" },
  { name: "Open Sans",         family: "'Open Sans', sans-serif",          category: "Sans-serif" },
  { name: "Lato",              family: "'Lato', sans-serif",               category: "Sans-serif" },
  { name: "Montserrat",        family: "'Montserrat', sans-serif",         category: "Sans-serif" },
  { name: "Oswald",            family: "'Oswald', sans-serif",             category: "Sans-serif" },
  { name: "Raleway",           family: "'Raleway', sans-serif",            category: "Sans-serif" },
  { name: "Nunito",            family: "'Nunito', sans-serif",             category: "Sans-serif" },
  { name: "Poppins",           family: "'Poppins', sans-serif",            category: "Sans-serif" },
  { name: "Inter",             family: "'Inter', sans-serif",              category: "Sans-serif" },
  { name: "Exo 2",             family: "'Exo 2', sans-serif",              category: "Sans-serif" },
  { name: "Ubuntu",            family: "'Ubuntu', sans-serif",             category: "Sans-serif" },
  { name: "Cabin",             family: "'Cabin', sans-serif",              category: "Sans-serif" },
  // Serif
  { name: "Times New Roman",   family: "'Times New Roman', serif",         category: "Serif" },
  { name: "Georgia",           family: "Georgia, serif",                   category: "Serif" },
  { name: "Playfair Display",  family: "'Playfair Display', serif",        category: "Serif" },
  { name: "Merriweather",      family: "'Merriweather', serif",            category: "Serif" },
  { name: "Lora",              family: "'Lora', serif",                    category: "Serif" },
  { name: "Libre Baskerville", family: "'Libre Baskerville', serif",       category: "Serif" },
  { name: "Crimson Text",      family: "'Crimson Text', serif",            category: "Serif" },
  // Display
  { name: "Bebas Neue",        family: "'Bebas Neue', cursive",            category: "Display" },
  { name: "Righteous",         family: "'Righteous', cursive",             category: "Display" },
  { name: "Fredoka One",       family: "'Fredoka One', cursive",           category: "Display" },
  { name: "Russo One",         family: "'Russo One', sans-serif",          category: "Display" },
  { name: "Boogaloo",          family: "'Boogaloo', cursive",              category: "Display" },
  // Handwriting
  { name: "Pacifico",          family: "'Pacifico', cursive",              category: "Handwriting" },
  { name: "Dancing Script",    family: "'Dancing Script', cursive",        category: "Handwriting" },
  { name: "Great Vibes",       family: "'Great Vibes', cursive",           category: "Handwriting" },
  { name: "Sacramento",        family: "'Sacramento', cursive",            category: "Handwriting" },
  { name: "Satisfy",           family: "'Satisfy', cursive",               category: "Handwriting" },
  { name: "Caveat",            family: "'Caveat', cursive",                category: "Handwriting" },
  { name: "Permanent Marker",  family: "'Permanent Marker', cursive",      category: "Handwriting" },
  // Monospace
  { name: "Courier New",       family: "'Courier New', monospace",         category: "Monospace" },
  { name: "Source Code Pro",   family: "'Source Code Pro', monospace",     category: "Monospace" },
  { name: "Fira Code",         family: "'Fira Code', monospace",           category: "Monospace" },
  { name: "Space Mono",        family: "'Space Mono', monospace",          category: "Monospace" },
  { name: "Roboto Mono",       family: "'Roboto Mono', monospace",         category: "Monospace" },
];

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Open+Sans:wght@400;700&family=Montserrat:wght@400;700&family=Playfair+Display:wght@400;700&family=Lato:wght@400;700&family=Oswald:wght@400;700&family=Raleway:wght@400;700&family=Merriweather:wght@400;700&family=Pacifico&family=Dancing+Script:wght@400;700&family=Nunito:wght@400;700&family=Poppins:wght@400;700&family=Inter:wght@400;700&family=Exo+2:wght@400;700&family=Ubuntu:wght@400;700&family=Cabin:wght@400;700&family=Lora:wght@400;700&family=Libre+Baskerville:wght@400;700&family=Crimson+Text:wght@400;700&family=Bebas+Neue&family=Righteous&family=Fredoka+One&family=Russo+One&family=Boogaloo&family=Great+Vibes&family=Sacramento&family=Satisfy&family=Caveat:wght@400;700&family=Permanent+Marker&family=Source+Code+Pro:wght@400;700&family=Fira+Code:wght@400;700&family=Space+Mono:wght@400;700&family=Roboto+Mono:wght@400;700&display=swap";

export function loadDesignerFonts(): void {
  if (typeof document === "undefined" || document.getElementById("gfonts-idcard")) return;
  const link = document.createElement("link");
  link.id = "gfonts-idcard";
  link.rel = "stylesheet";
  link.href = GOOGLE_FONTS_URL;
  document.head.appendChild(link);
}

export function loadHomepageFonts(): void {
  if (typeof document === "undefined" || document.getElementById("hp-fonts")) return;
  const link = document.createElement("link");
  link.id = "hp-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Playfair+Display:wght@700;900&display=swap";
  document.head.appendChild(link);
}
