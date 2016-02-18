# jsbook

jsbook 是一个用Node.js编写的可以批量把pdf文件转换成html网页格式的小工具。目前只在linux系统中测试通过，并且系统中需要安装poppler，通过调用其中的pdftocairo命令先转换成图片，再转换成html网页。

作者: 川月
电邮: cy@baow.com

## Installation

```
    sudo npm install jsbook
```

## Usage

把pdf文件放在一个目录下，比如：pdffiles

```
cd pdfiles
jsbook build
```

重新生成网页

```
jsbook html
```

重新生成当前目录中的网页

```
jsbook whtml
```


