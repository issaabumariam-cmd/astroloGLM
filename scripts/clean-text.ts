import fs from "fs";
import path from "path";

const INPUT = path.join(process.cwd(), "data", "book_full_text.txt");
const OUTPUT = path.join(process.cwd(), "data", "book_clean.txt");

// Common English words to help detect word boundaries
const COMMON_WORDS = new Set([
  "the", "and", "that", "for", "are", "was", "his", "has", "had", "her",
  "with", "this", "from", "they", "were", "been", "have", "will", "can",
  "not", "but", "all", "one", "when", "who", "how", "what", "which",
  "their", "them", "these", "those", "there", "then", "than", "some",
  "into", "over", "also", "more", "such", "only", "many", "very", "much",
  "may", "must", "should", "would", "could", "does", "did", "done",
  "being", "having", "each", "both", "other", "about", "after", "before",
  "between", "through", "during", "without", "within", "above", "below",
  "upon", "unto", "onto", "is", "it", "in", "on", "at", "to", "of", "as",
  "by", "be", "or", "an", "so", "no", "if", "we", "he", "she", "us",
  "our", "out", "own", "any", "yet", "now", "new", "old", "its",
  "a", "I", "me", "my", "do", "go", "up", "am",
]);

// Astrology-specific terms
const ASTRO_WORDS = new Set([
  "horoscope", "zodiac", "planet", "planets", "mercury", "venus", "mars",
  "jupiter", "saturn", "uranus", "neptune", "pluto", "sun", "moon",
  "aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra",
  "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
  "house", "houses", "aspect", "aspects", "conjunction", "sextile",
  "square", "trine", "opposition", "ascending", "descending",
  "ascendant", "midheaven", "nadir", "zenith", "ecliptic",
  "longitude", "latitude", "declination", "right", "ascension",
  "sidereal", "time", "natal", "birth", "chart", "native",
  "sign", "signs", "ruler", "rulership", "dignity", "detriment",
  "exaltation", "fall", "element", "fire", "earth", "air", "water",
  "cardinal", "fixed", "mutable", "modality", "aspect", "orb",
  "transit", "transits", "retrograde", "direct", "station",
  "degree", "degrees", "minute", "minutes", "second", "seconds",
  "equinox", "solstice", "precession", "epoch", "cosmos",
  "astrology", "astrologer", "astrologers", "astronomy", "astronomer",
  "horoscopes", "calculation", "calculate", "calculated",
  "position", "positions", "influence", "influences",
  "character", "nature", "temperament", "disposition",
  "karma", "reincarnation", "ego", "soul", "spirit",
]);

const ALL_WORDS = new Set([...COMMON_WORDS, ...ASTRO_WORDS]);

function splitWords(text: string): string {
  // Insert spaces before capital letters that follow lowercase (camelCase detection)
  let result = text.replace(/([a-z])([A-Z])/g, "$1 $2");

  // Insert spaces after periods before words
  result = result.replace(/\.(?=[A-Z])/g, ". ");

  // Common prefixes/suffixes that should be separated
  result = result.replace(/^(the|and|but|for|with|from|that|this|which|their|they|were|have|been|when|then|than|into|upon|over|also|such|more|most|some|each|both|only|very|much|many|will|must|should|would|could|does|done|being|having|about|after|before|other|which|there|here|where|while|since|though|through|during|without|within|above|below)/gi, "$1 ");

  // Fix common joined patterns
  result = result
    .replace(/ofthe/gi, "of the ")
    .replace(/andthe/gi, "and the ")
    .replace(/tothe/gi, "to the ")
    .replace(/inthe/gi, "in the ")
    .replace(/onthe/gi, "on the ")
    .replace(/bythe/gi, "by the ")
    .replace(/forthe/gi, "for the ")
    .replace(/isthe/gi, "is the ")
    .replace(/atthe/gi, "at the ")
    .replace(/fromthe/gi, "from the ")
    .replace(/withthe/gi, "with the ")
    .replace(/thatthe/gi, "that the ")
    .replace(/asthe/gi, "as the ")
    .replace(/orthe/gi, "or the ")
    .replace(/isthe/gi, "is the ")
    .replace(/inahoroscope/gi, "in a horoscope")
    .replace(/ofa/gi, "of a ")
    .replace(/isa/gi, "is a ")
    .replace(/itis/gi, "it is ")
    .replace(/thathe/gi, "that he ")
    .replace(/thatshe/gi, "that she ")
    .replace(/itis/gi, "it is ")
    .replace(/itisalso/gi, "it is also ")
    .replace(/thereis/gi, "there is ")
    .replace(/thereare/gi, "there are ")
    .replace(/thisis/gi, "this is ")
    .replace(/whichis/gi, "which is ")
    .replace(/whichare/gi, "which are ")
    .replace(/hasbeen/gi, "has been ")
    .replace(/havebeen/gi, "have been ")
    .replace(/hadbeen/gi, "had been ")
    .replace(/isnot/gi, "is not ")
    .replace(/arenot/gi, "are not ")
    .replace(/wasnot/gi, "was not ")
    .replace(/donot/gi, "do not ")
    .replace(/doesnot/gi, "does not ")
    .replace(/willnot/gi, "will not ")
    .replace(/cannot/gi, "can not ")
    .replace(/shouldnot/gi, "should not ")
    .replace(/couldnot/gi, "could not ")
    .replace(/wouldnot/gi, "would not ")
    .replace(/mustnot/gi, "must not ")
    .replace(/shallnot/gi, "shall not ")
    .replace(/maynot/gi, "may not ")
    .replace(/ifnot/gi, "if not ")
    .replace(/ifwe/gi, "if we ")
    .replace(/ifhe/gi, "if he ")
    .replace(/ifshe/gi, "if she ")
    .replace(/ifthey/gi, "if they ")
    .replace(/weshall/gi, "we shall ")
    .replace(/weshould/gi, "we should ")
    .replace(/wemust/gi, "we must ")
    .replace(/wecan/gi, "we can ")
    .replace(/wemay/gi, "we may ")
    .replace(/wewill/gi, "we will ")
    .replace(/wehave/gi, "we have ")
    .replace(/weare/gi, "we are ")
    .replace(/wedo/gi, "we do ")
    .replace(/wefind/gi, "we find ")
    .replace(/weseek/gi, "we seek ")
    .replace(/weknow/gi, "we know ")
    .replace(/wemust/gi, "we must ")
    .replace(/hewill/gi, "he will ")
    .replace(/heshall/gi, "he shall ")
    .replace(/hehas/gi, "he has ")
    .replace(/heis/gi, "he is ")
    .replace(/shewill/gi, "she will ")
    .replace(/shehas/gi, "she has ")
    .replace(/sheis/gi, "she is ")
    .replace(/theyare/gi, "they are ")
    .replace(/theyhave/gi, "they have ")
    .replace(/theywill/gi, "they will ")
    .replace(/theywere/gi, "they were ")
    .replace(/theman/gi, "the man ")
    .replace(/thewoman/gi, "the woman ")
    .replace(/thechart/gi, "the chart ")
    .replace(/thehoroscope/gi, "the horoscope ")
    .replace(/thehouse/gi, "the house ")
    .replace(/thesign/gi, "the sign ")
    .replace(/theplanet/gi, "the planet ")
    .replace(/thesun/gi, "the sun ")
    .replace(/themoon/gi, "the moon ")
    .replace(/thedeath/gi, "the death ")
    .replace(/thebirth/gi, "the birth ")
    .replace(/thelife/gi, "the life ")
    .replace(/thetime/gi, "the time ")
    .replace(/thenative/gi, "the native ")
    .replace(/theman/gi, "the man ")
    .replace(/ofhis/gi, "of his ")
    .replace(/ofher/gi, "of her ")
    .replace(/oftheir/gi, "of their ")
    .replace(/ofour/gi, "of our ")
    .replace(/ofthis/gi, "of this ")
    .replace(/ofthat/gi, "of that ")
    .replace(/tobe/gi, "to be ")
    .replace(/tohave/gi, "to have ")
    .replace(/todo/gi, "to do ")
    .replace(/tomake/gi, "to make ")
    .replace(/tosee/gi, "to see ")
    .replace(/toknow/gi, "to know ")
    .replace(/tofind/gi, "to find ")
    .replace(/tounderstand/gi, "to understand ")
    .replace(/andis/gi, "and is ")
    .replace(/andare/gi, "and are ")
    .replace(/andhas/gi, "and has ")
    .replace(/andhave/gi, "and have ")
    .replace(/andwill/gi, "and will ")
    .replace(/andcan/gi, "and can ")
    .replace(/andmust/gi, "and must ")
    .replace(/andshould/gi, "and should ")
    .replace(/butis/gi, "but is ")
    .replace(/butare/gi, "but are ")
    .replace(/buthas/gi, "but has ")
    .replace(/buthave/gi, "but have ")
    .replace(/inahoroscope/gi, "in a horoscope")
    .replace(/inthis/gi, "in this ")
    .replace(/inthat/gi, "in that ")
    .replace(/inorder/gi, "in order ")
    .replace(/incase/gi, "in case ")
    .replace(/inlife/gi, "in life ")
    .replace(/inhis/gi, "in his ")
    .replace(/inher/gi, "in her ")
    .replace(/onhis/gi, "on his ")
    .replace(/onher/gi, "on her ")
    .replace(/athis/gi, "at his ")
    .replace(/ather/gi, "at her ")
    .replace(/forhis/gi, "for his ")
    .replace(/forher/gi, "for her ")
    .replace(/byhis/gi, "by his ")
    .replace(/byher/gi, "by her ")
    .replace(/withhis/gi, "with his ")
    .replace(/withher/gi, "with her ")
    .replace(/fromhis/gi, "from his ")
    .replace(/fromher/gi, "from her ")
    .replace(/aswell/gi, "as well ")
    .replace(/aswe/gi, "as we ")
    .replace(/ashe/gi, "as he ")
    .replace(/asshe/gi, "as she ")
    .replace(/asthey/gi, "as they ")
    .replace(/asif/gi, "as if ")
    .replace(/asit/gi, "as it ")
    .replace(/sothat/gi, "so that ")
    .replace(/soas/gi, "so as ")
    .replace(/suchas/gi, "such as ")
    .replace(/ratherthan/gi, "rather than ")
    .replace(/insteadof/gi, "instead of ")
    .replace(/becauseof/gi, "because of ")
    .replace(/outof/gi, "out of ")
    .replace(/oneof/gi, "one of ")
    .replace(/allof/gi, "all of ")
    .replace(/someof/gi, "some of ")
    .replace(/mostof/gi, "most of ")
    .replace(/noneof/gi, "none of ")
    .replace(/eachof/gi, "each of ")
    .replace(/bothof/gi, "both of ")
    .replace(/firstof/gi, "first of ")
    .replace(/lastof/gi, "last of ")
    .replace(/nameof/gi, "name of ")
    .replace(/numberof/gi, "number of ")
    .replace(/kindof/gi, "kind of ")
    .replace(/sortof/gi, "sort of ")
    .replace(/partof/gi, "part of ")
    .replace(/placeof/gi, "place of ")
    .replace(/pointof/gi, "point of ")
    .replace(/stateof/gi, "state of ")
    .replace(/useof/gi, "use of ")
    .replace(/senseof/gi, "sense of ")
    .replace(/caseof/gi, "case of ")
    .replace(/factthat/gi, "fact that ")
    .replace(/ideathat/gi, "idea that ")
    .replace(/notionthat/gi, "notion that ")
    .replace(/thoughtthat/gi, "thought that ")
    .replace(/beliefthat/gi, "belief that ")
    .replace(/feelingthat/gi, "feeling that ")
    .replace(/hopethat/gi, "hope that ")
    .replace(/meaningthat/gi, "meaning that ")
    .replace(/seemsthat/gi, "seems that ")
    .replace(/appearsthat/gi, "appears that ")
    .replace(/meansthat/gi, "means that ")
    .replace(/showsthat/gi, "shows that ")
    .replace(/provesthat/gi, "proves that ")
    .replace(/indicatesthat/gi, "indicates that ")
    .replace(/suggeststhat/gi, "suggests that ")
    .replace(/impliesthat/gi, "implies that ")
    .replace(/meansthat/gi, "means that ")
    .replace(/isaids/gi, "is said ")
    .replace(/isshown/gi, "is shown ")
    .replace(/isfound/gi, "is found ")
    .replace(/isknown/gi, "is known ")
    .replace(/isseen/gi, "is seen ")
    .replace(/isgiven/gi, "is given ")
    .replace(/ismade/gi, "is made ")
    .replace(/isdone/gi, "is done ")
    .replace(/isborn/gi, "is born ")
    .replace(/istaken/gi, "is taken ")
    .replace(/isplaced/gi, "is placed ")
    .replace(/isfound/gi, "is found ")
    .replace(/areborn/gi, "are born ")
    .replace(/areplaced/gi, "are placed ")
    .replace(/areshown/gi, "are shown ")
    .replace(/aregiven/gi, "are given ")
    .replace(/arefound/gi, "are found ")
    .replace(/areknown/gi, "are known ")
    .replace(/areseen/gi, "are seen ")
    .replace(/willbe/gi, "will be ")
    .replace(/shallbe/gi, "shall be ")
    .replace(/canbe/gi, "can be ")
    .replace(/maybe/gi, "may be ")
    .replace(/mustbe/gi, "must be ")
    .replace(/shouldbe/gi, "should be ")
    .replace(/wouldbe/gi, "would be ")
    .replace(/couldbe/gi, "could be ")
    .replace(/hasbeen/gi, "has been ")
    .replace(/havebeen/gi, "have been ")
    .replace(/hadbeen/gi, "had been ")
    .replace(/willhave/gi, "will have ")
    .replace(/shallhave/gi, "shall have ")
    .replace(/canhave/gi, "can have ")
    .replace(/mayhave/gi, "may have ")
    .replace(/musthave/gi, "must have ")
    .replace(/shouldhave/gi, "should have ")
    .replace(/wouldhave/gi, "would have ")
    .replace(/couldhave/gi, "could have ")
    .replace(/toborn/gi, "to born ")
    .replace(/tobeseen/gi, "to be seen ")
    .replace(/tobefound/gi, "to be found ")
    .replace(/tobemade/gi, "to be made ")
    .replace(/tobegiven/gi, "to be given ")
    .replace(/tobetaken/gi, "to be taken ")
    .replace(/tobeplaced/gi, "to be placed ")
    .replace(/beingborn/gi, "being born ")
    .replace(/beingplaced/gi, "being placed ")
    .replace(/beingmade/gi, "being made ")
    .replace(/beinggiven/gi, "being given ")
    .replace(/beingtaken/gi, "being taken ")
    .replace(/beingfound/gi, "being found ")
    .replace(/beingseen/gi, "being seen ")
    .replace(/beingknown/gi, "being known ")
    .replace(/beingshown/gi, "being shown ");

  // Clean up multiple spaces
  result = result.replace(/\s+/g, " ").trim();

  return result;
}

async function main() {
  console.log("🧹 Astrolo Text Cleanup");
  console.log("========================\n");

  if (!fs.existsSync(INPUT)) {
    console.error(`❌ Not found: ${INPUT}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT, "utf-8");
  console.log(`📄 Read ${raw.length} chars\n`);

  console.log("🔧 Splitting joined words...");
  const cleaned = splitWords(raw);
  console.log(`   ✓ ${cleaned.length} chars after cleanup\n`);

  // Show sample
  const sample = cleaned.slice(0, 500);
  console.log("📝 Sample (first 500 chars):");
  console.log(sample);
  console.log("");

  fs.writeFileSync(OUTPUT, cleaned, "utf-8");
  console.log(`💾 Written to ${OUTPUT}`);

  console.log("\n✅ Cleanup complete! Re-run ingest-book.ts to re-chunk the cleaned text.");
}

main().catch(console.error);