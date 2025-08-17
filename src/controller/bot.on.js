const { YtDlp } = require("ytdlp-nodejs");
const { join } = require("path");
const {
  mkdirSync,
  existsSync,
  unlinkSync,
  readdirSync,
  statSync,
} = require("fs");

const ytdlp = new YtDlp();

// Fayl nomini xavfsiz qilish
function safeFileName(name) {
  return name.replace(/[<>:"/\\|?*]/g, "").slice(0, 100);
}

async function downloadVideo(ctx, url) {
  try {
    const newUri = url.split("/");

    // Upload papkasini tayyorlash
    const pathFile = join(__dirname, "..", "..", "uploads");
    if (!existsSync(pathFile)) mkdirSync(pathFile, { recursive: true });

    // Papkani tozalash
    readdirSync(pathFile).forEach((f) => unlinkSync(join(pathFile, f)));

    // Qo‘llab-quvvatlanadigan linkmi?
    const isVideoLink =
      newUri[2].includes("youtu.be") ||
      newUri[2].includes("youtube.com") ||
      newUri[2].includes("instagram.com") ||
      newUri[2].includes("tiktok.com");

    if (!isVideoLink) return ctx.reply("❌ Bu qo‘llab-quvvatlanmaydigan link!");

    await ctx.reply("⏳ Video yuklab olinmoqda...");

    // Video ma’lumotlarini olish
    const info = await ytdlp.getInfoAsync(url);
    const safeTitle = safeFileName(info.fulltitle || "video");
    const outputPath = join(pathFile, safeTitle + ".mp4");

    // Past sifatda yuklash (tezroq)
    await ytdlp.downloadAsync(url, {
      output: outputPath,
      format: "best[height<=720]",
    });

    if (!existsSync(outputPath)) return ctx.reply("❌ Video yuklab bo‘lmadi.");

    // Hajmni tekshirish
    const stats = statSync(outputPath);
    const actualMB = stats.size / (1024 * 1024);
    if (actualMB > 45) {
      unlinkSync(outputPath);
      return ctx.reply(
        `⚠️ Video hajmi ${actualMB.toFixed(
          2
        )} MB — 45 MB dan katta bo‘lgani uchun yubora olmayman.`
      );
    }

    // Video yuborish
    await ctx.replyWithVideo(
      { source: outputPath },
      {
        caption: `📹 ${info.fulltitle}`,
      }
    );

    unlinkSync(outputPath);
  } catch (error) {
    console.error("Video yuklashda xatolik:", error);
    return ctx.reply("❌ Video yuklashda xatolik yuz berdi.");
  }
}

module.exports = { downloadVideo };
