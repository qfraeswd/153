const Discord = require('discord.js');
const { Client, Util} = require('discord.js');
const config = require("./config.json");
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');
const devs = ['564414567946387487']
const developers = ['564414567946387487'];
const prefix = "3"

const client = new Client({ disableEveryone: true});

const youtube = new YouTube(config.GOOGLE_API_KEY);
const PREFIX = config.prefix;

const queue = new Map();

client.on('warn', console.warn);

client.on('error', console.error);

client.on('ready', () => console.log('أنا مستعد!'));

client.on('disconnect', () => console.log('أنا غير متصل'));

client.on('reconnecting', () => console.log('أنا قطع الاتصال!'));

client.on('voiceStateUpdate', (oldMember, newMember) => {
  let newUserChannel = newMember.voiceChannel
  let oldUserChannel = oldMember.voiceChannel
  const serverQueue = queue.get(oldMember.guild.id);


  if(oldUserChannel === undefined && newUserChannel !== undefined) {
      // User joines a voice channel
  } else if(newUserChannel === undefined){

    // User leaves a voice channel
      if(oldMember.id === '522658354238324756'){
          return console.log("BOT");
      }
      else{
          if(client.guilds.get(oldMember.guild.id).voiceConnection != null){
              if(client.guilds.get(oldMember.guild.id).voiceConnection.channel.id === oldUserChannel.id){
                    if(oldUserChannel.members.size < 2){
                        serverQueue.songs = [];
                        serverQueue.connection.dispatcher.end('تم خارج بسبيب عدام يوجد حد فى الروم صوتى')
                    }    
              }else{
                  return console.log('انت ليس في نفس القناة الصوتية');
              }
          }else{
              return undefined;
          }
      }
         

  }
})


client.on('message', async msg => { // eslint-disable-line
    if (msg.author.bot) return undefined;
    if (!msg.content.startsWith(PREFIX)) return undefined;
    const args = msg.content.split(' ');
    const searchString = args.slice(1).join(' ');
    const url = args[1];
    const serverQueue = queue.get(msg.guild.id);
    
    if(msg.content.startsWith(`${PREFIX}play`)){
        const voiceChannel = msg.member.voiceChannel;
        if(!voiceChannel){
            var embedplay1 = new Discord.RichEmbed()
                .setTitle(`يرجى الاتصال بقناة صوتية تشغيل الاغانى بعض ما`)
                .setColor(['GREEN'])
            return msg.channel.sendEmbed(embedplay1);
        }
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if(!permissions.has('CONNECT')){
            var embedplay2 = new Discord.RichEmbed()
                .setTitle(`أفتقر إلى الاتصال الصحيح للاتصال في هذه القناة الصوتية!`)
                .setColor(['GREEN'])
            return msg.channel.sendEmbed(embedplay2);
        }
        if (!permissions.has('SPEAK')){
            var embedplay3 = new Discord.RichEmbed()
                .setTitle(`ليس لدي الحق في التحدث إلى هذه القناة الصوتية!`)
                .setColor(['GREEN'])
            return msg.channel.sendEmbed(embedplay3);
        }
        
    
                      
        if(url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)){
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for(const video of Object.values(videos)){
                const video2 = await youtube.getVideoByID(video.id);
                await handleVideo(video2, msg, voiceChannel, true);
            }
            var embedplay4 = new Discord.RichEmbed()
                .setTitle(`قائمة التشغيل: ${playlist.title} في قائمة الانتظار!`)
                .setColor(['GREEN'])
            return msg.channel.sendEmbed(embedplay4);
        }else{
            try{
                var video = await youtube.getVideo(url);
            }catch(error){
                try{
                    var videos = await youtube.searchVideos(searchString, 10);
                    let index = 0;
                    var embedqueue5 = new Discord.RichEmbed()
                        .setTitle(`Song Play list*`)
                        .setDescription(`
${videos.map(video2 => `${++index}- ${video2.title}`).join('\n')}
Please enter a number between 1-10 on,a Song select!`)
                .setColor(['GREEN'])
                    msg.channel.sendEmbed(embedqueue5);
                    
                    try{
                       var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
                           maxMatches: 1,
                           time: 10000,
                           errors: ['time']
                       }); 
                    }catch(err){
                        console.error(err);
                        var embedplay6 = new Discord.RichEmbed()
                            .setTitle(`لا أو تم إدخال رقم غير صالح. هدم اختيار الأغنية!`)
                            .setColor(['GREEN'])
                        return msg.channel.sendEmbed(embedplay6);
                    }
                    const videoIndex = parseInt(response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                }catch(err){
                    console.error(err);
                    var embedplay7 = new Discord.RichEmbed()
                        .setTitle(`لم أجد أي فيديو!`)
                        .setColor(['GREEN'])
                    return msg.channel.sendEmbed(embedplay7);
                }
            }
            return handleVideo(video, msg, voiceChannel);
        }
    
    } else if(msg.content.startsWith(`${PREFIX}skip`)) {
        if(!msg.member.voiceChannel){
           var embedskip1 = new Discord.RichEmbed()
                .setTitle(`أنت لست في القناة الصوتية!`)
                .setColor(['GREEN'])
            return msg.channel.sendEmbed(embedskip1); 
        }
        if(!serverQueue){
            var embedskip2 = new Discord.RichEmbed()
                .setTitle(`لا يوجد شيء لتخطي!`)
                .setColor(['GREEN'])
            return msg.channel.sendEmbed(embedskip2);
        }
        serverQueue.connection.dispatcher.end('تخطي الأمر قد استخدم!');
        var embedskip3 = new Discord.RichEmbed()
            .setTitle(`⏩ تخطي 👍`)
            .setColor(['GREEN'])
        return msg.channel.sendEmbed(embedskip3);
    }   
        
     else if (msg.content.startsWith(`${PREFIX}leave`)){
        if(!msg.member.voiceChannel){
           var embedstop1 = new Discord.RichEmbed()
                .setTitle(`أنت لست في القناة الصوتية!`)
                .setColor(['GREEN'])
            return msg.channel.sendEmbed(embedstop1); 
        }
        if(!serverQueue){
            var embedstop2 = new Discord.RichEmbed()
                .setTitle(`ليس هناك شيء لترك!`)
                .setColor(['GREEN'])
            return msg.channel.sendEmbed(embedstop2);
        }
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end('تم استخدام أمر إيقاف!');
        var embedstop3 = new Discord.RichEmbed()
            .setTitle(`⏩ تخطي 👍`)
            .setColor(['GREEN'])
        return msg.channel.sendEmbed(embedstop3);
    }
    else if(msg.content.startsWith(`${PREFIX}song`)){
        if(!serverQueue){
            var embedsong1 = new Discord.RichEmbed()
                .setTitle(`لا يفعل شيئًا في الوقت الحالي!`)
                .setColor(['GREEN'])
            return msg.channel.sendEmbed(embedsong1);
                 }
            var embedsong2 = new Discord.RichEmbed()
                .setTitle(`${serverQueue.songs[0].title}`)
                .setThumbnail(serverQueue.songs[0].thumbnail)
                .setDescription(`
فون: ${serverQueue.songs[0].channel}
داور: ${serverQueue.songs[0].duration}
حلقة الوصل: ${serverQueue.songs[0].url}
`)
                .setColor(['GREEN'])
            return msg.channel.sendEmbed(embedsong2); 
    }
    else if(msg.content.startsWith(`${PREFIX}volume`)){
        if(!serverQueue){
            var embedvolume1 = new Discord.RichEmbed()
                .setTitle(`لا يفعل شيئًا في الوقت الحالي!`)
                .setColor(['GREEN'])
            return msg.channel.sendEmbed(embedvolume1);}
        if(!args[1]){
             var embedvolume2 = new Discord.RichEmbed()
                .setTitle(`حجم الحالي هو : ${serverQueue.volume}`)
                .setColor(['GREEN'])
            return msg.channel.sendEmbed(embedvolume2);
        }
        
        if(args[1]>0){
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolume(args[1] / 2000);
        serverQueue.mute = false;
        var embedvolume3 = new Discord.RichEmbed()
                .setTitle(`مستوى الصوت في وضع التشغيل ${args[1]} جلس`)
                .setColor(['GREEN'])
        return msg.channel.sendEmbed(embedvolume3);
        } else{
            var embedvolume4 = new Discord.RichEmbed()
                .setTitle(`الرجاء إدخال رقم`)
                .setColor(['GREEN'])
            return msg.channel.sendEmbed(embedvolume4);
        }
    }
    else if(msg.content.startsWith(`${PREFIX}queue`)){
        if(!serverQueue){
            var embedqueue1 = new Discord.RichEmbed()
                .setTitle(`لا يفعل شيئًا في الوقت الحالي!`)
                .setColor(['GREEN'])
        return msg.channel.sendEmbed(embedqueue1);
        }
        var embedqueue2 = new Discord.RichEmbed()
                .setTitle(`قائمة انتظار الأغنية`)
                .setDescription(`
${serverQueue.songs.map(song => `- ${song.title}`).join('\n')}
Playing: ${serverQueue.songs[0].title}`)
                .setColor(['GREEN'])
        return msg.channel.sendEmbed(embedqueue2);
    }
    else if(msg.content.startsWith(`${PREFIX}stop`)){
        if(serverQueue && serverQueue.playing) {
        serverQueue.playing = false;
        serverQueue.connection.dispatcher.pause();
        var embedpause1 = new Discord.RichEmbed()
                .setTitle(`تم إيقاف الأغنية!`)
                .setColor(['GREEN'])
        return msg.channel.sendEmbed(embedpause1);
        }
        var embedpause2 = new Discord.RichEmbed()
            .setTitle(`لا يفعل شيئًا في الوقت الحالي!`)
            .setColor(['GREEN'])
        return msg.channel.sendEmbed(embedpause2);
    }
    else if(msg.content.startsWith(`${PREFIX}run`)){
        if(serverQueue && !serverQueue.playing){
        serverQueue.playing = true;
        serverQueue.connection.dispatcher.resume();
        var embedresume1 = new Discord.RichEmbed()
                .setTitle(`الأغنية تستمر في تشغيل!`)
                .setColor(['GREEN'])
        return msg.channel.sendEmbed(embedresume1);           
        }
        var embedresume2 = new Discord.RichEmbed()
            .setTitle(`لا يفعل شيئًا في الوقت الحالي!`)
            .setColor(['GREEN'])
        return msg.channel.sendEmbed(embedresume2);
    }   
    else if(msg.content.startsWith(`${PREFIX}mute`)){
        if(!serverQueue){
        var embedmute1 = new Discord.RichEmbed()
                .setTitle(`لا يفعل شيئًا في الوقت الحالي!`)
                .setColor(['GREEN'])
        return msg.channel.sendEmbed(embedmute1);     
        }
        if(serverQueue.mute){
        var embedmute2 = new Discord.RichEmbed()
                .setTitle(`بوت الموسيقى صامتة بالفعل!`)
                .setColor(['GREEN'])
        return msg.channel.sendEmbed(embedmute2);     
        }
        else{
            serverQueue.mute = true;
            serverQueue.connection.dispatcher.setVolume(0 / 2000);
            var embedmute3 = new Discord.RichEmbed()
                .setTitle(`كان بوت الموسيقى صامتة!`)
                .setColor(['GREEN'])
        return msg.channel.sendEmbed(embedmute3);
        }
    }
    else if(msg.content.startsWith(`${PREFIX}unmute`)){
        if(!serverQueue){
            var embedunmute1 = new Discord.RichEmbed()
                .setTitle(`لا يفعل شيئًا في الوقت الحالي!`)
                .setColor(['GREEN'])
            return msg.channel.sendEmbed(embedunmute1);     
        }
        if(!serverQueue.mute){
            var embedunmute2 = new Discord.RichEmbed()
                .setTitle(`الموسيقى بوت غير صامت بالفعل!`)
                .setColor(['GREEN'])
            return msg.channel.sendEmbed(embedunmute2);     
        }   
        else{
            serverQueue.mute = false;
            serverQueue.connection.dispatcher.setVolume(serverQueue.volume / 2000);
            var embedunmute3 = new Discord.RichEmbed()
                .setTitle(`وقد الموسيقى بوت تم كتم الصوت!`)
                .setColor(['GREEN'])
        return msg.channel.sendEmbed(embedunmute3);
        }
    }
    return undefined;
});


async function handleVideo(video, msg, voiceChannel, playlist=false){
    const serverQueue = queue.get(msg.guild.id);
    
    const song = {
        id: video.id,
        title: Util.escapeMarkdown(video.title),
        url: `https://www.youtube.com/watch?v=${video.id}`,
        thumbnail: video.thumbnails.default.url,
        channel: video.channel.title,
        duration: `${video.duration.hours}hrs : ${video.duration.minutes}min : ${video.duration.seconds}sec`
    };
    if(!serverQueue){
        const queueConstruct = {
            textChannel: msg.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 2000,
            mute: false,
            playing: true
        };
        queue.set(msg.guild.id, queueConstruct);

        queueConstruct.songs.push(song);

        try{
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(msg.guild, queueConstruct.songs[0]);
        }catch(error){
            console.log(error);
            queue.delete(msg.guild.id);
            var embedfunc1 = new Discord.RichEmbed()
                .setTitle(`بوت لا ستطع دخول الغرف الصوتى..!`)
                .setColor(['GREEN'])
            return msg.channel.sendEmbed(embedfunc1);
        }
    } else {
        serverQueue.songs.push(song);
        console.log(serverQueue.songs);
        if(playlist) return undefined;
        else{
            var embedfunc2 = new Discord.RichEmbed()
                .setTitle(`${song.title} في قائمة الانتظار!`)
                .setColor(['GREEN'])
            return msg.channel.sendEmbed(embedfunc2);
        }
    }    
    return undefined;
}

function play(guild, song){
    const serverQueue = queue.get(guild.id);
    
    if(!song){
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
    console.log(serverQueue.songs);
    
    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
            .on('end', reason => {
                if(reason === 'تيار لا يولد بسرعة كافية.') console.log('انتهت الأغنية');
                else console.log(reason);
                serverQueue.songs.shift();
                setTimeout(() => {
                play(guild, serverQueue.songs[0]);
                }, 250);
            })
            .on('error', error => console.log(error)); 
            
    dispatcher.setVolume(serverQueue.volume / 2000);
    
    var messagefunction1 = new Discord.RichEmbed()
                .setTitle(`تلعب 🎶 ${song.title} ${PREFIX}now`)
                .setColor(['GREEN'])
            return serverQueue.textChannel.sendEmbed(messagefunction1);
}

client.on('message', message => {
	var prefix = "1"
    var argresult = message.content.split(` `).slice(1).join(' ');
      if (!developers.includes(message.author.id)) return;
 
  if (message.content.startsWith(prefix + 'wt')) {
  client.user.setActivity(argresult, {type:'WATCHING'});
      message.channel.send(` ☑ Client Activity Now Is : \`Watching ${argresult} \` `)
  } else 
  if (message.content.startsWith(prefix + 'ls')) {
  client.user.setActivity(argresult , {type:'LISTENING'});
      message.channel.send(` ☑ Client Activity Now Is : \`Listening ${argresult} \` `)
  } else 
  if (message.content.startsWith(prefix + 'st')) {
    client.user.setGame(argresult, "https://www.twitch.tv/omgdoma");
     message.channel.send(` ☑ Client Activity Now Is : \`Streaming ${argresult} \` `)
  } else 
  if (message.content.startsWith(prefix + 'Me')) {
  client.user.setActivity(argresult , {type:'Playing'});
      message.channel.send(` ☑ Client Activity Now Is : \`Playing ${argresult} \` `)
  }
  if (message.content.startsWith(prefix + 'setname')) {
  client.user.setUsername(argresult).then
      message.channel.send(` Client UserName Changed To : \` ${argresult}\` `)
} else
if (message.content.startsWith(prefix + 'setavatar')) {
  client.user.setAvatar(argresult);
      message.channel.send(` Client Avatar Changed To : \` ${argresult}\` `)
	   } else 
  if (message.content.startsWith(prefix + 'cstop')) {
  client.user.setActivity(argresult , {type:''});
      message.channel.send(` ☑ Client Activity Now Is : \` ${argresult} \` `)
}
});

client.on('message', message => {
	var prefix = "3"
if (message.content.startsWith(prefix + 'help')) { 
    let pages = [`
:headphones: | ***__Music Commands__*** | :headphones:

**
:headphones: | ${PREFIX}play    ➾  لكي تشغل اغناي او رابط فيديو
:headphones: | ${PREFIX}skip    ➾  لك تسوي تخطي لي الاغاني
:headphones: | ${PREFIX}song    ➾  لك تري ما هي الغاني  التي تعمل
:headphones: | ${PREFIX}leave   ➾  لك يخروج البوت خرج الشانل
:headphones: | ${PREFIX}queue   ➾  لك تري قائمة الاغاني بعد الغاني التي تعمال حالي
:headphones: | ${PREFIX}volume  ➾  لك تري مستوي الصوت
:headphones: | ${PREFIX}volume  ➾  (لك تغير مستوي الصوت
:headphones: | ${PREFIX}stop    ➾  لك توقف الغاني موقت)
:headphones: | ${PREFIX}run     ➾  لك تكمل الغاني الموقف
:headphones: | ${PREFIX}mute    ➾  لك تسوي ميوت لي الوت
:headphones: | ${PREFIX}unmute  ➾  لك تفوك الميوت عن البوت
**

**__ضغط على ركشن [ ▶ ]الى ذهب الى الصفحه التالى__**
   `
,`
** رابط قناة ** . ***EL KABEER PUBG*** : https://www.youtube.com/channel/UC-gINwNmFrp_6TNuGTgzJvA 

** لا تسنى شتراك فى القناة و تفعل الجراس :bellhop:  **

** وضغط على زار الايك :thumbsup:  **

** تشجع النا وستمرا فى نشر اكثر نشاالله ** `]
    let page = 1;

    let embed = new Discord.RichEmbed()
    .setColor('RANDOM')
    .setFooter(`صفحة ${page} من ${pages.length}`)
    .setDescription(pages[page-1])

    message.author.sendEmbed(embed).then(msg => {

        msg.react('◀').then( r => {
            msg.react('▶')


        const backwardsFilter = (reaction, user) => reaction.emoji.name === '◀' && user.id === message.author.id;
        const forwardsFilter = (reaction, user) => reaction.emoji.name === '▶' && user.id === message.author.id;


        const backwards = msg.createReactionCollector(backwardsFilter, { time: 2000000});
        const forwards = msg.createReactionCollector(forwardsFilter, { time: 2000000});



        backwards.on('collect', r => {
            if (page === 1) return;
            page--;
            embed.setDescription(pages[page-1]);
            embed.setFooter(`Page ${page} of ${pages.length}`);
            msg.edit(embed)
        })
        forwards.on('collect', r => {
            if (page === pages.length) return;
            page++;
            embed.setDescription(pages[page-1]);
            embed.setFooter(`Page ${page} of ${pages.length}`);
            msg.edit(embed)
        })
        })
    })
    }
});

client.on('message', msg => {
    if (msg.content === '3help') {
      msg.reply(' | **تم رسال اوامر بوت اغانى فى الخاص** | :incoming_envelope:');
    }
  });
  
  client.on('message',async message => { 
    var room;
    var chat;
    var duration;
    var gMembers;
    var filter = m => m.author.id === message.author.id;
    if(message.content.startsWith("3Me")) { 
        //return message.channel.send(':heavy_multiplication_x:| **هذا الامر معطل حاليا.. ``حاول في وقت لاحق``**'); ///By KillerFox
        if(!message.guild.member(message.author).hasPermission('MANAGE_GUILD')) return message.channel.send(':heavy_multiplication_x:| **يجب أن يكون لديك خاصية التعديل على السيرفر**');
        message.channel.send(`:eight_pointed_black_star:| **منشن الروم الذي تريد به ارسال الرساله**`).then(msgg => { ///By KillerFox
            message.channel.awaitMessages(filter, {
                max: 1,
                time: 20000,
                errors: ['time']
            }).then(collected => { 
                let room = message.guild.channels.find('name', collected.first().content);
                if(!room) return message.channel.send(':heavy_multiplication_x:| **لم اقدر على ايجاد الروم المطلوب**'); ///By KillerFox
                room = collected.first().content;
                collected.first().delete();
                        msgg.edit(':eight_pointed_black_star:| ** اكتب الرساله الي تبيها **').then(msg => { ///By KillerFox
                            message.channel.awaitMessages(filter, { 
                                max: 1,
                                time: 20000,
                                errors: ['time'] 
                            }).then(collected => {
                                chat = collected.first().content;
                                collected.first().delete();
                                try {
                                    let Embed = new Discord.RichEmbed()
                                        .setAuthor(message.guild.name, message.guild.iconURL)
                                        .setTitle(`إرسال بواسطة `+'``'+`${message.author.username}`+'``')
                                        .setDescription(chat)
                                        .setFooter(message.author.username, message.author.avatarURL);
                                    message.guild.channels.find('name', room).send(Embed).then(m => {
                                        let re = m.react('🎉');
                                        setTimeout(() => { 
                                            let users = m.reactions.get("🎉").users;
                                            let list = users.array().filter(u => u.id !== m.author.id);
                                            let gFilter = list[Math.floor(Math.random() * list.length) + 0];
                                            if(users.size === 1) gFilter = '**لم يتم التحديد**';
                                            let Embed = new Discord.RichEmbed()
                                                .setAuthor(message.author.username, message.author.avatarURL)
                                                .setTitle(chat)
                                                .addField(`ping`+`[${Date.now() - message.createdTimestamp}]`)
                                                .setFooter(message.guild.name, message.guild.iconURL);
                                            m.edit(Embed);
                                        },duration); 
                                    });
                                    msgg.edit(`:heavy_check_mark:| تم ارسال الرساله في الروم`); 
                                } catch(e) {
                                    msgg.edit(`:heavy_multiplication_x:| **لم اقدر على ارسال الرسالة**`); 
                                    console.log(e);
                                }
                            });
                        });
                    });
                });
  }
});

client.login(process.env.BOT_TOKEN);
