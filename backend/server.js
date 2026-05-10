require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Multer — keep files in memory as buffers ──────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB per file
});

// ── Groq client (same API as OpenAI, different base URL) ─────────────────────
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

app.use(cors());
app.use(express.json());

// ── POST /api/grade ───────────────────────────────────────────────────────────
app.post(
  "/api/grade",
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "backImage",  maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files;

      if (!files?.frontImage?.[0] || !files?.backImage?.[0]) {
        return res.status(400).json({ error: "Both front and back images are required." });
      }

      const frontFile = files.frontImage[0];
      const backFile  = files.backImage[0];

      // Convert buffers to base64 data URIs
      const frontDataURI = `data:${frontFile.mimetype};base64,${frontFile.buffer.toString("base64")}`;
      const backDataURI  = `data:${backFile.mimetype};base64,${backFile.buffer.toString("base64")}`;

      const response = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a professional trading card grader. You will be provided with TWO images: the front and the back of a trading card. 
Look closely at the centering, corners, edges, and surface of BOTH sides. 
Keep these rules in mind.
A PSA Gem Mint 10 card is a virtually perfect card. Attributes include four perfectly sharp corners, sharp focus and full original gloss. A PSA Gem Mint 10 card must be free of staining of any kind, but an allowance may be made for a slight printing imperfection, if it doesn't impair the overall appeal of the card. The image must be centered on the card within a tolerance not to exceed approximately 55/45 percent on the front, and 75/25 percent on the reverse.
A PSA Mint 9 is a superb condition card that exhibits only one of the following minor flaws: a very slight wax stain on reverse, a minor printing imperfection or slightly off white borders. Centering must be approximately 60/40 or better on the front and 90/10 or better on the reverse.
A PSA NM-MT 8 is a super high-end card that appears Mint 9 at first glance, but upon closer inspection, the card can exhibit the following: a very slight wax stain on reverse, slightest fraying at one or two corners, a minor printing imperfection, and/or slightly off-white borders. Centering must be approximately 65/35 or better on the front and 90/10 or better on the reverse.
A PSA NM 7 is a card with just a slight surface wear visible upon close inspection. There may be slight fraying on some corners. Picture focus may be slightly out-of register. A minor printing blemish is acceptable. Slight wax staining is acceptable on the back of the card only. Most of the original gloss is retained. Centering must be approximately 70/30 or better on the front and 90/10 or better on the back.
A PSA 6 card may have visible surface wear or a printing defect which does not detract from its overall appeal. A very light scratch may be detected only upon close inspection. Corners may have slightly graduated fraying. Picture focus may be slightly out-of-register. Card may show some loss of original gloss, may have minor wax stain on reverse, may exhibit very slight notching on edges and may also show some off-whiteness on borders. Centering must be 80/20 or better on the front and 90/10 or better on the reverse.
On PSA 5 cards, very minor rounding of the corners is becoming evident. Surface wear or printing defects are more visible. There may be minor chipping on edges. Loss of original gloss will be more apparent. Focus of picture may be slightly out-of-register. Several light scratches may be visible upon close inspection, but do not detract from the appeal of the card. Card may show some off-whiteness of borders. Centering must be 85/15 or better on the front and 90/10 or better on the back.
A PSA 4 card's corners may be slightly rounded. Surface wear is noticeable but modest. The card may have light scuffing or light scratches. Some original gloss will be retained. Borders may be slightly off-white. A light crease may be visible. Centering must be 85/15 or better on the front and 90/10 or better on the back.
A PSA 3 card reveals some rounding of the corners, though not extreme. Some surface wear will be apparent, along with possible light scuffing or light scratches. Focus may be somewhat off-register and edges may exhibit noticeable wear. Much, but not all, of the card's original gloss will be lost. Borders may be somewhat yellowed and/or discolored. A crease may be visible. Printing defects are possible. Slight stain may show on obverse and wax staining on reverse may be more prominent. Centering must be 90/10 or better on the front and back.
A PSA 2 card's corners show accelerated rounding and surface wear is starting to become obvious. A good card may have scratching, scuffing, light staining, or chipping of enamel on obverse. There may be several creases. Original gloss may be completely absent. Card may show considerable discoloration. Centering must be 90/10 or better on the front and back.
A PSA 1.5 card's corners will show extreme wear, possibly affecting framing of the picture. The surface of the card will show advanced stages of wear, including scuffing, scratching, pitting, chipping and staining.
A PSA 1 will exhibit many of the same qualities of a PSA 1.5 but the defects may have advanced to such a serious stage that the eye appeal of the card has nearly vanished in its entirety.
Return EXACTLY a JSON object with these keys: 
"card_name" (string, identify the specific character or item, e.g., "Charizard Holo"),
"card_type" (string, the series or game, e.g., "Pokemon Base Set"),
"grade" (string, e.g., "PSA 8"), and 
"reason" (string, a short 1-sentence explanation of the flaws found).`,
          },
          // Few-shot: perfect card
          {
            role: "user",
            content: [
              { type: "text", text: "Grade this frontside card." },
              { type: "image_url", image_url: { url: "https://i.ebayimg.com/images/g/4C0AAeSwu2RpgPXY/s-l1600.webp" } },
              { type: "text", text: "Grade this backside card." },
              { type: "image_url", image_url: { url: "https://i.ebayimg.com/images/g/r~YAAeSwC7lpgPXY/s-l1600.webp" } },
            ],
          },
          {
            role: "assistant",
            content: `{"card_name": "Charizard Holo", "card_type": "Pokemon Base Set", "grade": "PSA 10", "reason": "Flawless 50/50 centering, sharp corners, and pristine edges."}`,
          },
          // Few-shot: damaged card
          {
            role: "user",
            content: [
              { type: "text", text: "Grade this card. (Assume I uploaded a heavily played Pikachu with scratched foil and white edges)." },
            ],
          },
          {
            role: "assistant",
            content: `{"card_name": "Pikachu", "card_type": "Pokemon Base Set", "grade": "PSA 4", "reason": "Severe whitening on the bottom edges, rounded corners, and a noticeable surface scratch."}`,
          },
          // Real request
          {
            role: "user",
            content: [
              { type: "text", text: "Here is the FRONT of the card:" },
              { type: "image_url", image_url: { url: frontDataURI } },
              { type: "text", text: "Here is the BACK of the card:" },
              { type: "image_url", image_url: { url: backDataURI } },
            ],
          },
        ],
      });

      const resultText = response.choices[0].message.content;
      if (!resultText) throw new Error("No response from Groq");

      const parsed = JSON.parse(resultText);
      return res.json(parsed);
    } catch (error) {
      console.error("Grading Error:", error?.message ?? error);
      // Fallback so the UI always gets a valid response
      return res.json({
        card_name: "Unknown Card",
        card_type: "Trading Card",
        grade: "PSA 8",
        reason: "Fallback grade: could not process images. Check API key or token limit.",
      });
    }
  }
);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── POST /api/mint ────────────────────────────────────────────────────────────
// Mints a graded card NFT via Crossmint and delivers to recipient email/wallet
app.post(
  "/api/mint",
  upload.single("cardImage"),
  async (req, res) => {
    try {
      const { email, cardName, grade, reason, centering, corners, edges, surface } = req.body;

      if (!email || !cardName || !grade) {
        return res.status(400).json({ error: "email, cardName and grade are required." });
      }

      // 1. Upload card image to ImgBB to get a public URL
      let imageUrl = "https://images.pokemontcg.io/base1/4_hires.png"; // fallback
      if (req.file) {
        try {
          const base64Image = req.file.buffer.toString("base64");
          const imgbbRes = await fetch(
            `https://api.imgbb.com/1/upload?key=387be6d219c4616e0a8d1b77f9d14f58`,
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: `image=${encodeURIComponent(base64Image)}&name=${encodeURIComponent(cardName)}`,
            }
          );
          const imgbbData = await imgbbRes.json();
          if (imgbbData?.data?.url) {
            imageUrl = imgbbData.data.url;
          }
        } catch (imgErr) {
          console.warn("ImgBB upload failed, using fallback image:", imgErr?.message);
        }
      }

      // 2. Determine recipient format (email or wallet)
      const isWallet = email.startsWith("solana:") || email.length === 44;
      const recipient = isWallet ? email : `email:${email}:solana`;

      // 3. Build NFT metadata (Solana name field max 32 bytes UTF-8)
      const truncateTo32Bytes = (str) => {
        const buf = Buffer.from(str, "utf8");
        if (buf.length <= 32) return str;
        return buf.slice(0, 32).toString("utf8").replace(/\uFFFD/g, "").trim();
      };

      const gradeNum = parseFloat(grade.replace(/[^\d.]/g, "")) || 8;
      const rawName  = `${cardName} — ${grade}`;
      const metadata = {
        name: truncateTo32Bytes(rawName),
        description: `AI-graded trading card certified by CardProof. Grade: ${grade}. ${reason ?? ""}`,
        image: imageUrl,
        attributes: [
          { trait_type: "Grade",      value: grade },
          { trait_type: "Centering",  value: centering  ?? gradeNum.toFixed(1) },
          { trait_type: "Corners",    value: corners    ?? gradeNum.toFixed(1) },
          { trait_type: "Edges",      value: edges      ?? gradeNum.toFixed(1) },
          { trait_type: "Surface",    value: surface    ?? gradeNum.toFixed(1) },
          { trait_type: "Certified By", value: "CardProof AI" },
          { trait_type: "Chain",      value: "Solana" },
        ],
      };

      // 4. Call Crossmint minting API
      const crossmintRes = await fetch(
        `https://staging.crossmint.com/api/2022-06-09/collections/${process.env.CROSSMINT_COLLECTION_ID}/nfts`,
        {
          method: "POST",
          headers: {
            "x-api-key": process.env.CROSSMINT_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ recipient, metadata }),
        }
      );

      const crossmintData = await crossmintRes.json();

      if (!crossmintRes.ok) {
        console.error("Crossmint error:", crossmintData);
        return res.status(crossmintRes.status).json({
          error: crossmintData?.message ?? "Crossmint minting failed.",
          details: crossmintData,
        });
      }

      console.log("Minted NFT:", crossmintData?.id, "→", recipient);
      return res.json({
        success: true,
        nftId: crossmintData?.id,
        mintHash: crossmintData?.onChain?.mintHash ?? null,
        recipient,
        imageUrl,
        message: isWallet
          ? "NFT minted to your wallet!"
          : `NFT sent to ${email} — check your inbox!`,
      });
    } catch (error) {
      console.error("Mint Error:", error?.message ?? error);
      return res.status(500).json({ error: "Minting failed. Try again shortly." });
    }
  }
);


// ── GET /api/mint/:nftId — poll for on-chain mint address ─────────────────────
app.get("/api/mint/:nftId", async (req, res) => {
  try {
    const { nftId } = req.params;
    const r = await fetch(
      `https://staging.crossmint.com/api/2022-06-09/collections/${process.env.CROSSMINT_COLLECTION_ID}/nfts/${nftId}`,
      { headers: { "x-api-key": process.env.CROSSMINT_API_KEY } }
    );
    const data = await r.json();
    return res.json({
      status:    data?.onChain?.status ?? "pending",
      mintHash:  data?.onChain?.mintHash ?? null,
      chain:     data?.onChain?.chain ?? "solana",
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});


app.use((err, req, res, _next) => {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      grade: "PSA 8",
      reason: "Image too large (max 25 MB). Try compressing your photo and re-uploading.",
    });
  }
  console.error("Unhandled error:", err?.message ?? err);
  return res.status(500).json({
    grade: "PSA 8",
    reason: "Server error — fallback grade applied.",
  });
});

app.listen(PORT, () => {
  console.log(`CardProof backend running on http://localhost:${PORT}`);
});
