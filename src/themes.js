async function getThemes() {
  var link = document.createElement("link");
  link.href = "../themes/";

  try {
    const response = await fetch(link.href);
    const text = await response.text();
    
    var parser = new DOMParser();
    var htmlDocument = parser.parseFromString(text, 'text/html');
    var files = Array.from(htmlDocument.querySelectorAll('a'))
      .map(a => a.textContent.trim())
      .filter(a => a && a.endsWith('.css'));

    var cssFiles = {};

    for (const file of files) {
      try {
        const response = await fetch(link.href + file);
        const text = await response.text();

        var header = {};
        var styles = "";

        var headerEndIndex = text.indexOf('*/') -2;
        var headerText = text.substring(2, headerEndIndex).trim();

        headerText.split('\n').forEach(function(line) {
          var colonIndex = line.indexOf(':');
          var key = line.substring(0, colonIndex).trim();
          var value = line.substring(colonIndex + 1).trim();
          header[key] = value;
        });

        styles = text.substring(headerEndIndex + 1).trim();

        cssFiles[file] = {
          "header": header,
          "styles": styles
        };
      } catch (error) {
        console.error(`Erro ao carregar o arquivo ${file}: ${error}`);
      }
    }

    console.log(cssFiles);
  } catch (error) {
    console.error(`Erro ao carregar a lista de arquivos CSS: ${error}`);
  }
}

export { getThemes };
