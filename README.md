# minimal-lightbox


*This lightbox is a simplified and lighter version of the one made by [mshwery](https://github.com/mshwery/minimal-lightbox). All the credits goes to him. I really liked his lightbox, and I tried to make it ES5 compliant to reduce the size. The result is a 4kb minified js file (& ~1kb css), still super easy to use.*

A minimal Medium.com-style lightbox for enlarging media using css transforms, scaling images from their position on a page

## Usage

Currently, only img tags with `data-action=zoom` will be picked up on page load and bound to be zoomable. This module is dependent on classes/styles to produce the lightbox effect, so your mileage may vary on certain older browsers.

You'll need to include the styles as well.

```html
<!DOCTYPE html>
<html>
<head>
  <link rel='stylesheet' type='text/css' href='minimal-lightbox.css'>
</head>
<body>
  <img src='http://lorempixel.com/1000/400' data-action='zoom'/>
  
  <!-- include the package -->
  <script type="text/javascript" src="minimal-lightbox.js"></script>
</body>
</html>
```
