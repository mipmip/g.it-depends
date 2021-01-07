$(function() {

  // Get the input field
  var input = document.getElementById("query");

  // Execute a function when the user releases a key on the keyboard
  input.addEventListener("keyup", function(event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      // Cancel the default action, if needed
      event.preventDefault();
      // Trigger the button element with a click
      document.getElementById("search").click();
    }
  });

  let packagefile= getPackageFile($('#language').val());
  $("#packageFile").html(packagefile);

  $('#language').change(function(){
    let packagefile= getPackageFile($('#language').val());
    $("#packageFile").html(packagefile);
  });

  $('#search').click(function(){
    $('#repositories').html('');
    in_code(
      $('#language').val(),
      $('#query').val(),
      $('#sort').val(),
      $('#order').val(),
      1
    );
    return false;
  });
});

function readAccesCode(){

}

function get_repo(url){

  url= url+"?access_token="+github_personal_access_code;

  $.ajax({
    url: url,
    dataType: 'json'
  }).done( function(data) {
    $("#stars"+data.id).html(koma(data.stargazers_count))
    $("#forks"+data.id).html(koma(data.forks_count))
    $("#crdate"+data.id).html(relative_time(data.created_at))
    $("#tsdate"+data.id).html(relative_time(data.updated_at))
  }).fail(function(){
  });
}

function getPackageFile(language){
  let pFiles={}

  pFiles.crystal = 'shard.yml'
  pFiles.javascript = 'package.json'
  pFiles.ruby = 'Gemfile'
  pFiles.go = 'go.mod'
  pFiles.rust = 'Cargo.toml'
  pFiles.python = 'requirements.txt'

  return pFiles[language];

}
function in_code(language, query, sort, order, page) {

  packagefile= getPackageFile(language);

  if(language==="ruby"){
    query = "gem "+query;
  }
  else if(language==="crystal"){
    query = ""+query;
  }

  const queryString = 'q=' + encodeURIComponent(query+' filename:'+packagefile);

  var url = 'https://api.github.com/search/code?' + queryString + '&page=' + page + "&access_token="+github_personal_access_code;
  $('#debug').html(url);

  $.ajax({
    url: url,
    dataType: 'json'
  }).done(function(data) {
    if(data.total_count == undefined){
      $('#more').css('display', 'none');
    } else {
      var html = '',
        description = '';

      $('#total').html(data.total_count);
      let repo_urls = [];
      data.items.forEach(async function( item) {
        let repo= item.repository;
        if (repo.description != '' && repo.description != null && repo.description != undefined) {
          description = strip_tags(repo.description);
        }

        html += '<li>';
        html += ' <a target="_BLANK" href="' + repo.html_url + '">' + repo.full_name + '</a>';
        html += ' <div class="description">' + description + '</div>';
        html += ' <div class="repo">';
        html += '  <span>Stars:</span> <code id="stars'+repo.id+'"></code> | ';
        html += '  <span>Forks:</span> <code id="forks'+repo.id+'"></code> | ';
        html += '  <span>Created:</span> <code id="crdate'+repo.id+'"></code> | ';
        html += '  <span>Updated:</span> <code id="tsdate'+repo.id+'"></code>';
        html += ' </div>';
        html += ' <div class="statistics" id="' + repo.id + '"></div>';
        html += '</div>';
        html += '</li>';

        repo_urls.push(repo.url);

      });

      $('#repositories').append(html);

      repo_urls.forEach(async function( url ) {
        get_repo(url);
      });

      $('.activity').click(function(){
        var id = $(this).data('ids'),
          repo = $(this).data('repo');
        statistics(repo, id);
        $(this).next('.last_activity').css('display', 'inline-block');
        $(this).remove();
        return false;
      });
      $('.last_activity').click(function(){
        var id = $(this).data('ids');
        $('#' + id).toggle();
        return false;
      });
      $('#more').css('display', 'block');
      $('#more').click(function(){
        in_code(language, query, sort, order, (page + 1));
        return false;
      });
    }
  }).fail(function() {
    $('#repositories').append('<h2>Something gone wrong.</h2>');
  });
}

function statistics(repo, id) {
  $.ajax({
    url: 'https://api.github.com/repos/' + repo + '/stats/punch_card',
    dataType: 'json'
  }).done(function(data) {
    var sunday = 0,
      monday = 0,
      tuesday = 0,
      wednesday = 0,
      thursday = 0,
      friday = 0,
      saturday = 0;
    $.each(data, function(i, item) {
      if(item[0] == 0){
        sunday += item[2];
      }else if(item[0] == 1){
        monday += item[2];
      }else if(item[0] == 2){
        tuesday += item[2];
      }else if(item[0] == 3){
        wednesday += item[2];
      }else if(item[0] == 4){
        thursday += item[2];
      }else if(item[0] == 5){
        friday += item[2];
      }else if(item[0] == 6){
        saturday += item[2];
      }
    });
    var html = '<table>';
    html += '<thead><tr><td>sunday</td><td>monday</td><td>tuesday</td><td>wednesday</td><td>thursday</td><td>friday</td><td>saturday</td></tr><thead>';
    html += '<tbody><tr>';
    html += '<td><code>' + sunday + '</code></td>';
    html += '<td><code>' + monday + '</code></td>';
    html += '<td><code>' + tuesday + '</code></td>';
    html += '<td><code>' + wednesday + '</code></td>';
    html += '<td><code>' + thursday + '</code></td>';
    html += '<td><code>' + friday + '</code></td>';
    html += '<td><code>' + saturday + '</code></td>';
    html += '</tr><tbody>';
    html += '</table>';
    $('#' + id).append(html);
    commits(repo, id);
  }).fail(function() {
    alert('API rate limit exceeded.');
  });
}
function commits(repo, id) {
  $.ajax({
    url: 'https://api.github.com/repos/' + repo + '/commits',
    crossDomain: true,
    dataType: 'json'
  }).done(function(b) {
    var html = '<table>';
    $.each(b, function(i, a) {
      html += '<tr><td class="title min">' + relative_time(b[i].commit.committer.date) + ' ago</td><td class="title"><pre class="prettyprint">' + strip_tags(b[i].commit.message) + '</pre></td></tr>'
    });
    html += '</table>';
    $('#' + id).append(html);
    var prt = document.createElement('script'); prt.async = true;
    prt.type = 'text/javascript';
    prt.src = 'https://cdn.rawgit.com/google/code-prettify/master/loader/run_prettify.js?skin=desert';
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(prt);
  })
}

function strip_tags(input, allowed) {
  allowed = (((allowed || '') + '')
    .toLowerCase()
    .match(/<[a-z][a-z0-9]*>/g) || [])
    .join('');
  var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
    commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
  return input.replace(commentsAndPhpTags, '')
    .replace(tags, function($0, $1) {
      return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
    });
}
function relative_time(a) {
  if (!a) {
    return
  }
  a = $.trim(a);
  a = a.replace(/\.\d\d\d+/, "");
  a = a.replace(/-/, "/").replace(/-/, "/");
  a = a.replace(/T/, " ").replace(/Z/, " UTC");
  a = a.replace(/([\+\-]\d\d)\:?(\d\d)/, " $1$2");
  var b = new Date(a);
  var c = (arguments.length > 1) ? arguments[1] : new Date();
  var d = parseInt((c.getTime() - b) / 1000);
  d = (d < 2) ? 2 : d;
  var r = '';
  if (d < 60) {
    r = 'jst now'
  } else if (d < 120) {
    r = 'a min'
  } else if (d < (45 * 60)) {
    r = (parseInt(d / 60, 10)).toString() + ' mns'
  } else if (d < (2 * 60 * 60)) {
    r = 'an hr'
  } else if (d < (24 * 60 * 60)) {
    r = (parseInt(d / 3600, 10)).toString() + ' hrs'
  } else if (d < (48 * 60 * 60)) {
    r = 'a day'
  } else {
    dd = (parseInt(d / 86400, 10)).toString();
    if (dd <= 30) {
      r = dd + ' dys'
    } else {
      mm = (parseInt(dd / 30, 10)).toString();
      if (mm <= 12) {
        r = mm + ' mon'
      } else {
        r = (parseInt(mm / 12, 10)).toString() + ' yrs'
      }
    }
  }
  return r
}
function koma(a) {
  var b = parseInt(a, 10);
  if (b === null) {
    return 0
  }
  if (b >= 1000000000) {
    return (b / 1000000000).toFixed(1).replace(/\.0$/, "") + "G"
  }
  if (b >= 1000000) {
    return (b / 1000000).toFixed(1).replace(/\.0$/, "") + "M"
  }
  if (b >= 1000) {
    return (b / 1000).toFixed(1).replace(/\.0$/, "") + "K"
  }
  return b
}
