// TODO: http://qiita.com/nurburg/items/744ec53477f4ae328555
// TODO: 輪講日時をシートに突っ込んで、開始の30分前くらいに再通知する。

var SLACK_API_ENDPOINT = "https://hooks.slack.com/services/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";
var RINKOU_SPREADSHEET = "https://docs.google.com/spreadsheets/d/1BPPYNYQS-HvvDkM4HWf3O59aeVpDd53foHuCe1Solns/edit#gid=0";

function run() {
  // 条件にマッチする受信メールを取得
  // ここで検索する受信メールは、このスプレッドシートを開いているGoogleアカウントのGmailになります。
  var threads = GmailApp.search('label:rinkou is:unread', 0, 10); // is:unread
  for (var i in threads) {
    var thread = threads[i];
    var m = parseData(thread.getMessages())[0];
    if (m.body.indexOf("輪講") !== -1) { //輪講メール
      var content = m.date + "\n" + "subject: " + m.subject + "\n" + "from: " + m.from + "\n" + m.body;
      var time = m.body.match(/Event-Time:(.+)$/mi);
      var host = m.body.match(/Event-Host:(.+)$/mi);
      var location = m.body.match(/Event-Location:(.+)$/mi);
      var time_content = time ? time[1] : null;
      var host_content = host ? host[1] : null;
      var loc_content = location ? location[1] : null;
      var content_began = m.body.indexOf("紹介します.");
      if (time_content && host_content && loc_content && content_began > 0) {

        content = "次回の輪講は *" + host_content + "* さんが発表だゾ！\n*" +
          time_content + "* から開始だゾ！\n場所は *" + loc_content + "* だゾ！\n" + m.body.substring(content_began + 7);
        //var spreadsheet = SpreadsheetApp.openByUrl(RINKOU_SPREADSHEET);

      }

      sendHttpPost(content);
    } else if (m.body.indexOf("グループミーティング") !== -1) {
      var content = "【ぐるみ通知だよ】\n" + m.body;
      sendHttpPost(content);
    }
    thread.markRead(); //既読にする
  }
}

/**
 * slackに投げる
 * @param  {[type]} message [description]
 * @return {[type]}         [description]
 */
function sendHttpPost(message) {
  // var url = "http://abc.xyz.org/jira/rest/api/2/issue";
  var payload = JSON.stringify({
    "text": message,
    // "channel": "#dev-bot"
    "channel": "#rinkou-mail"
  });

  var headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": "Basic _authcode_"
  };

  var options = {
    "method": "POST",
    "contentType": "application/json",
    "headers": headers,
    "payload": payload
  };

  var res = UrlFetchApp.fetch(SLACK_API_ENDPOINT, options);
}


/**
 * 日付、送信元、タイトル、本文をパース
 * @param  {[type]} msgs [description]
 * @return {[type]}      [description]
 */
function parseData(msgs) {
  var ret = [];
  for (var m in msgs) {
    try {
      var msg = msgs[m];
      ret.push({
        date: msg.getDate(),
        from: msg.getFrom(),
        subject: msg.getSubject(),
        body: msg.getPlainBody()
      });
    } catch (e) {
      Logger.log("Error: " + e);
    }
  }
  return ret;
}
