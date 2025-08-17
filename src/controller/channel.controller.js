let userModes = {}; // { userId: "channel" | "normal" }
let selectedChannels = {}; // { userId: channelUsername }
const ADMIN_ID = 5688582675;

const { Telegraf } = require("telegraf");
const botController = require("./bot.controller");

const { config } = require("dotenv");
config();

const token = process.env.BOT_TOKEN;
let bot;

async function setupBot() {
  if (bot) {
    bot.stop();
  }

  bot = new Telegraf(token);

  // Kanal va admin komandalarini ulash
  initChannelCommands(bot);

  // Oddiy foydalanuvchilar logikasi
  new botController().init(bot);

  bot
    .launch()
    .then(() => console.log("🤖 Bot polling rejimida ishga tushdi"))
    .catch((err) => console.error("❌ Botni ishga tushirishda xatolik:", err));

  return bot;
}

const CHANNELS = [
  { name: "Kosmetika kanal", username: "@kosmetika_with_Fab" },
  { name: "Video Add Music", username: "@video_add_music" },
];

// Foydalanuvchi kanal rejimidami?
function isChannelMode(userId) {
  return userModes[userId] === "channel";
}

function setChannelMode(userId, mode, channel = null) {
  userModes[userId] = mode ? "channel" : "normal";
  if (mode && channel) {
    selectedChannels[userId] = channel;
  } else {
    delete selectedChannels[userId];
  }
}

function initChannelCommands(bot) {
  // Admin kanal boshlash
  bot.command("channelStart", async (ctx) => {
    const userId = ctx.from.id;
    if (userId !== ADMIN_ID)
      return ctx.reply("⛔ Bu buyruq faqat admin uchun!");

    if (CHANNELS.length === 1) {
      setChannelMode(userId, true, CHANNELS[0].username);
      return ctx.reply(
        `✅ Kanal rejimi yoqildi!\nTanlangan kanal: ${CHANNELS[0].username}`
      );
    }

    await ctx.reply("📢 Qaysi kanalni tanlaysiz?", {
      reply_markup: {
        inline_keyboard: CHANNELS.map((ch) => [
          { text: ch.name, callback_data: `choose_channel|${ch.username}` },
        ]),
      },
    });
  });

  // Admin kanal to‘xtatish
  bot.command("channelStop", async (ctx) => {
    const userId = ctx.from.id;
    if (userId !== ADMIN_ID)
      return ctx.reply("⛔ Bu buyruq faqat admin uchun!");

    setChannelMode(userId, false);
    await ctx.reply(
      "🛑 Kanal rejimi o‘chirildi.\n✅ Endi oddiy rejim qayta yoqildi."
    );
  });

  // Callback query handler
  // Callback query handler
  bot.on("callback_query", async (ctx) => {
    const userId = ctx.from.id;
    const data = ctx.update.callback_query.data;

    // Admin: kanal tanlash
    if (data.startsWith("choose_channel")) {
      if (userId !== ADMIN_ID)
        return ctx.answerCbQuery("⛔ Siz admin emassiz!", { show_alert: true });

      const channel = data.split("|")[1];
      setChannelMode(userId, true, channel);
      await ctx.answerCbQuery();
      return ctx.reply(`✅ Kanal rejimi yoqildi!\nTanlangan kanal: ${channel}`);
    }

    // Foydalanuvchi: kanal a’zoligini tekshirish
    if (data === "check_sub") {
      const channels = ["kosmetika_with_Fab", "video_add_music"];
      let notJoined = [];

      for (let username of channels) {
        try {
          const member = await ctx.telegram.getChatMember(
            `@${username}`,
            userId
          );
          if (!member || member.status === "left")
            notJoined.push(`@${username}`);
        } catch (err) {
          console.error("check_sub error:", err);
        }
      }

      if (notJoined.length > 0) {
        // Foydalanuvchi hali ba'zi kanallarga a’zo emas
        return ctx.answerCbQuery(
          `⚠️ Siz hali quyidagi kanallarga a’zo emassiz:\n${notJoined.join(
            "\n"
          )}`,
          { show_alert: true }
        );
      } else {
        // Foydalanuvchi barcha kanallarga a’zo → kanallarga cheklov olib tashlash
        setChannelMode(userId, false); // normal rejimga o‘tkazish
        return ctx.answerCbQuery(
          "✅ Siz barcha kanallarga a’zosiz! Cheklovlar olib tashlandi. Endi video linkini yuboring",
          { show_alert: true }
        );
      }
    }
  });

  // Message handler
  bot.on("message", async (ctx, next) => {
    const userId = ctx.from.id;

    // Agar foydalanuvchi kanal rejimidami va kanal tanlangan bo‘lsa
    if (isChannelMode(userId) && selectedChannels[userId]) {
      try {
        await ctx.telegram.copyMessage(
          selectedChannels[userId],
          ctx.chat.id,
          ctx.message.message_id
        );
        return;
      } catch (err) {
        console.error("Kanalga yuborishda xatolik:", err);
      }
    }

    // Agar foydalanuvchi barcha kanallarga a’zo bo‘lsa → next() orqali bot to‘liq ishlashini davom ettirish
    return next();
  });
}

module.exports = {
  initChannelCommands,
  isChannelMode,
  setupBot,
};
