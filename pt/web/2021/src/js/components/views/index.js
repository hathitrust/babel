import {Scroll} from './scroll';
import {Thumbnail} from './thumbnail';
import {Single} from "./image";
import {Flip} from './flip';
import {PlainText} from './plaintext';
import {Page} from './page';

var View = {};
View.Scroll = Scroll;
View.Thumbnail = Thumbnail;
View.Single = Single;
View.Flip = Flip;
View.PlainText = PlainText;
View.Page = Page;

View.for = function(view) {
  if ( view == '1up' ) { return Scroll; }
  else if ( view == 'thumb' ) { return Thumbnail; }
  else if ( view == 'image' ) { return Single; }
  else if ( view == '2up' ) { return Flip; }
  else if ( view == 'text' || view == 'plaintext' ) { return PlainText; }
  else if ( view == 'page' ) { return Page; }
}

export {View};
