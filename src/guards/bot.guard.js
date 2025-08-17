let selectedChannel = null;
let channelMode = false; // kanal rejimi yoqilgan/yoqilmaganini belgilaydi
const ADMIN_ID = 5688582675;
const { setupBot } = require("../app.js"); // qayta init uchun

const CHANNELS = [
  { name: "Kosmetika kanal", username: "@kosmetika_with_Fab" },
  { name: "Video Add Music", username: "@video_add_music" },
];

function isChannelMode() {
  return channelMode;
}

function initChannelCommands(bot) {
  // /channelStart
  bot.command("channelStart", async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
      return ctx.reply("⛔ Bu buyruq faqat admin uchun!");
    }

    channelMode = true;

    if (CHANNELS.length === 1) {
      selectedChannel = CHANNELS[0].username;
      await ctx.reply(
        `✅ Kanal rejimi yoqildi!\nTanlangan kanal: ${selectedChannel}`
      );
      return setupBot(); // qayta init
    }

    await ctx.reply("📢 Qaysi kanalni tanlaysiz?", {
      reply_markup: {
        inline_keyboard: CHANNELS.map((ch) => [
          { text: ch.name, callback_data: `choose_channel|${ch.username}` },
        ]),
      },
    });
  });

  // /channelStop
  bot.command("channelStop", async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
      return ctx.reply("⛔ Bu buyruq faqat admin uchun!");
    }

    channelMode = false;
    selectedChannel = null;

    await ctx.reply(
      "🛑 Kanal rejimi o‘chirildi.\n✅ Endi oddiy rejim qayta yoqildi."
    );
    setupBot(); // qayta init
  });

  // Kanal tanlash callback
  bot.on("callback_query", async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
      return ctx.answerCbQuery("⛔ Siz admin emassiz!", { show_alert: true });
    }

    const data = ctx.update.callback_query.data;

    if (data.startsWith("choose_channel")) {
      const channel = data.split("|")[1];
      selectedChannel = channel;

      await ctx.answerCbQuery();
      await ctx.reply(
        `✅ Kanal rejimi yoqildi!\nTanlangan kanal: ${selectedChannel}`
      );
      setupBot(); // qayta init
    }
  });

  // Admin xabarlari kanalga forward qilinsin (faqat kanal rejimida)
  bot.on("message", async (ctx, next) => {
    if (ctx.from.id === ADMIN_ID && channelMode && selectedChannel) {
      try {
        await ctx.telegram.copyMessage(
          selectedChannel,
          ctx.chat.id,
          ctx.message.message_id
        );
        return; // boshqa handlerlar ishlamasin
      } catch (err) {
        console.error("Kanalga yuborishda xatolik:", err);
      }
    }
    return next(); // oddiy foydalanuvchilar uchun boshqa handlerlarga o'tadi
  });
}

module.exports = {
  initChannelCommands,
  isChannelMode,
  getSelectedChannel: () => selectedChannel,
};
