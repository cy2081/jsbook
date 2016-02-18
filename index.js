/*
 * 批量Pdf文件转成网页工具
 * 执行步骤:
 *     列目录
 *     对每个pdf文件转图片到 images 目录
 *     检查图片大小
 *     生成网页
 *     作者: 川月  cy@baow.com
 *     版本:0.1
 */

var fs      = require('fs'),
    cp      = require('child_process'),
    path    = require('path'),
    sizeOf  = require('image-size'),
    process = require('process'),
    exec    = require('child_process').exec,
    events  = require('events'),
    util    = require('util'),
    spawn   = require('child_process').spawn,
    jade    = require('jade'),
    colors  = require('colors');

var indexFn = jade.compileFile(path.join(__dirname,'tmpl', 'index.jade')), 
    pageFn = jade.compileFile(path.join(__dirname,'tmpl', 'page.jade')); 
    navFn = jade.compileFile(path.join(__dirname,'tmpl', 'nav.jade')); 

function PdfEvent() {
    events.EventEmitter.call(this);
}

util.inherits(PdfEvent, events.EventEmitter);

var pdfEvent = new PdfEvent();

pdfEvent.on('copyPdf', function (pdf, htmlPath) {
    var base = path.parse(pdf).base;
    var dstPdf = path.join(htmlPath, 'source.pdf');

    console.log('copy: %s'.red, base);
    readable = fs.createReadStream( pdf );
    writable = fs.createWriteStream( dstPdf );    
    readable.pipe( writable );
});

pdfEvent.on('pdfToHtml', function (pdf, htmlPath) {
    var title = path.parse(pdf).name;
    var imagePath = path.join(htmlPath, 'images');
    var base = path.parse(pdf).base;

    console.log('pdf to html: %s', title);

    try {
        fs.accessSync(imagePath, fs.R_OK);
    } catch (err) {
        fs.mkdirSync(imagePath, 0o777);
    }
    
    var cmd = spawn('pdftocairo', ['-png', pdf, imagePath + '/n']);
    
    console.log(`start building: ${base}`.green);
    cmd.stdout.on('data', (data) => {
        console.log(`stdout:${base}: ${data}`);
    });
    
    cmd.stderr.on('data', (data) => {
        console.log(`stderr: ${base}: ${data}`);
    });
    
    cmd.on('close', (code) => {
        console.log(`${base}: pdftocairo exited with code ${code}`);
        if (fs.readdirSync(imagePath).length > 0) {
            console.log(`${base}: start building html`);
            pdfEvent.emit('imageToHtml', htmlPath);
        } else {
            console.log(`${base}: no images files error!`);
        };
    });
});

pdfEvent.on('imageToHtml', function (htmlPath) {
    var imagePath = path.join(htmlPath, 'images');

    var index = [];
    var page = [];

    fs.readdir(imagePath, (err, files) => {
        var i=0,
            n=files.length;
        for (i; i<n; i++){
            page.push(files[i]);
            if (((i+1) % 20) == 0) {
                index.push(page);
                page = [];

            }
        }
        if (page.length) index.push(page);
        //console.log(__dirname);

        pdfEvent.emit('buildHtml', index, htmlPath);
    })
})

pdfEvent.on('buildHtml', function (indexA, htmlPath) {
    var pagesPath = path.join(htmlPath, 'pages'),
        imagePath = path.join(htmlPath, 'images'),
        indexFile = path.join(htmlPath, 'index.html'),
        title = path.parse(htmlPath).base,
        totalPages = indexA.length,
        i = 0, 
        allImages = fs.readdirSync(imagePath),
        item = null;

    if (allImages.length > 3) {
        aImage = path.join(imagePath, allImages[3]);
    } else {
        aImage = path.join(imagePath, allImages[0]);
    }

    var dimensions = sizeOf(aImage),
        width = dimensions.width,
        height = dimensions.height;

    try {
        fs.accessSync(pagesPath, fs.R_OK);
    } catch (err) {
        fs.mkdirSync(pagesPath, 0o777);
    }

    var indexHtml = indexFn({
            pageTitle: title, 
            pages: totalPages });

    fs.writeFile(indexFile, indexHtml, (err) => {
        if (err) throw err;
        console.log(title + ': index page saved'); 
    });


    for (i; i< totalPages; i++) {
        item = indexA[i];
        (function (total, num, images) {
            var pageHtml = pageFn({
                    pageTitle: '第' + num + '部分 - ' + title,
                    images: images,
                    width: width,
                    height: height,
                    nav: navFn({total: total, current: num})
                    });
            var pageFile = path.join(pagesPath, num + '.html');
            fs.writeFile(pageFile, pageHtml, (err) => {
                if (err) throw err;
                console.log(title + `: page ${num} saved`); 
            });

        })(totalPages, i+1, item);
    }
})

module.exports.build = function build (buildLocal, rebuildOnlyHtml) {
    var targetDir= process.env.PWD,
        buildPath = path.join(process.env.PWD, 'html-book');

    if (buildLocal) {
        buildPath = process.env.PWD;
    }

    try {
        fs.accessSync(buildPath, fs.R_OK);
    } catch (err) {
        fs.mkdirSync(buildPath, 0o777);
    }

    if (rebuildOnlyHtml) {
        fs.readdir(buildPath, (err, files) => {
            var i=0, n=files.length, htmlPath;
            for (i; i<n; i++){
                htmlPath = path.join(buildPath, files[i]);
                pdfEvent.emit('imageToHtml', htmlPath);
            }
        });
        return;
    }

    fs.readdir(targetDir, (err, files) => {
        var i=0, n=files.length, pdf, info, htmlPath, imagePath;

        for (i; i<n; i++){
            pdf = path.join(targetDir, files[i]);
            info = path.parse(pdf);
            if (info.ext == '.pdf'){
                htmlPath = path.join(buildPath, info.name);
                try {
                    fs.accessSync(htmlPath, fs.R_OK);
                } catch (err) {
                    fs.mkdirSync(htmlPath, 0o777);
                }

                pdfEvent.emit('copyPdf', pdf, htmlPath);
                pdfEvent.emit('pdfToHtml', pdf, htmlPath);
            }
        }
    })
}
