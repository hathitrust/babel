package Process::Watermark::PDF;

use Plack::Util;
use Plack::Util::Accessor qw(
  handle
  generated_text
  access_stmts
  target_ppi
  mdpItem
  message
  watermark
  debug
  document
  output_filename
  marginalia_width
  watermark_height
  watermark_width
  watermark_digitized
  watermark_original
);

use Data::Dumper;
use IPC::Run qw();
use PDF::API2;
require PDF::API2::_patches;

use POSIX qw(strftime ceil);

use SRV::Utils;
use Process::Globals;

use Image::ExifTool;

use constant LEFT_ALIGNED => 1;
use constant RIGHT_ALIGNED => 1;

sub new {
    my $proto = shift;
    my $class = ref $proto || $proto;

    my $self;
    if (@_ == 1 && ref $_[0] eq 'HASH') {
        $self = bless {%{$_[0]}}, $class;
    } else {
        $self = bless {@_}, $class;
    }

    $self;
}

sub run {
    my $self = shift;
    $self->start_initialization();
    $self->load_watermarks();
    $self->setup_generated_message();
    $self->setup_colophon_page();
    $self->setup_stamp_page();
    $self->finish_initialization();
}

sub cleanup {
    my $self = shift;
    unlink $self->output_filename if ( -f $self->output_filename );
}

sub start_initialization {
    my $self = shift;

    my $watermark_pdf = PDF::API2->new;
    $$watermark_pdf{forcecompress} = 0;
    $watermark_pdf->mediabox('Letter');

    $self->marginalia_width(0);
    $self->watermark_height(0);
    $self->watermark_width(0);

    $self->document($watermark_pdf);
}

sub finish_initialization {
    my $self = shift;

    $self->document->saveas($self->output_filename);
    $self->document(PDF::API2->open($self->output_filename));
}

sub setup_generated_message {
    my $self = shift;
    my ( $mdpItem, $watermark_pdf ) = ( $self->mdpItem, $self->document );

    my $message_1 = "";
    my $generated_text = $self->generated_text;
    if($generated_text) {
      $message_1 = $generated_text . "\n";
    }

    # attach the handle & brief access statement
    my $message_2 = $self->handle . " / " . $self->access_stmts->{stmt_head};

    # monospace font for better URL legibility
    my $font = PDF::API2::_findFont('DejaVuSansMono.ttf');
    my $message_filename = SRV::Utils::generate_temporary_filename($mdpItem, 'message.png');

    IPC::Run::run [
      $Process::Globals::convert,
      "-fill", '#C0C0C0', # ( $self->debug ? '#B1B1B1' : 'rgba(177,177,177, 0.35)' ), #'#B1B1B1',
      "-background", "white",
      "-font", $font,
      "-density", "144",
      "-pointsize", "14",
      "label:$message_1$message_2",
      "-gravity", "west",
      "-depth", "8",
      "-rotate", "-90",
      $message_filename
    ];

    $self->message($watermark_pdf->image_png($message_filename))
}

sub insert_generated_message {
    my $self = shift;
    my ( $page, $image ) = @_;

    my $mdpItem = $self->mdpItem;

    my ( $x0, $y0, $x1, $y1 ) = $page->get_mediabox;

    # find a ratio based on a fraction of the page height (orig: 0.6)
    my $r = ( $y1 * 0.6 ) / $$self{message}->height;
    if ( $r < 0.25 ) {
        $r = ( $y1 * 0.9 ) / $$self{message}->height;
    }
    $r = 1 if ( $r > 1 );

    my $image_h = $$self{message}->height * $r;
    my $image_w = $$self{message}->width * $r;

    $self->marginalia_width($image_w);

    my $gfx = ref($image) ? $image : $page->gfx;
    $gfx->image($$self{message}, 2, 15, $image_w, $image_h);

}

sub setup_colophon_page {
    my $self = shift;
    my ( $mdpItem, $watermark_pdf ) = ( $self->mdpItem, $self->document );

    my $page = $watermark_pdf->page();
    $page->mediabox('Letter');
    my ( $x0, $y0, $x1, $y1 ) = $page->get_mediabox;

    $self->insert_generated_message($page);

    my $gfx; my $text;
    my $toprint;

    ## add book data
    my $title = $mdpItem->GetFullTitle(1);
    my $author = $mdpItem->GetAuthor(1);
    my $publisher = $mdpItem->GetPublisher(1);

    my $title_font_size = 12;
    my $title_leading = $title_font_size * 1.25;
    my $font_size = 10;
    my $leading = $font_size * 1.25;
    my $heading_width = int($x1 * 0.7); # pixels

    # set up cover page fonts

    my $plain_font = $watermark_pdf->ttfont('DejaVuSans.ttf', -encode => 'utf8', -unicodemap => 1);
    my $bold_font = $watermark_pdf->ttfont('DejaVuSans-Bold.ttf', -encode => 'utf8', -unicodemap => 1);
    # Plain Unicode for the Author and Publisher at $font_size (10)
    my $plain_unicode_font = $watermark_pdf->ttfont('unifont-6.3.20131020.ttf', -encode => 'utf8', -unicodemap => 1);
    # Bold Unicode for Title at $title_font_size (12)
    # NOTE: the bold font isn't bold -- I tried the synfont method to make a variation but it doesn't
    # render any text. I know there have been issues with synthetic fonts in PDF::API2 so I don't
    # know where the problem lies. It's possible synthetic fonts only apply to PDF Core fonts.
    #
    # Just reuse the existing font so we don't risk embedding it twice.
    # Experimental evidence indicates this line would result in another embedded copy of unifont:
    #   my $bold_unicode_font = $watermark_pdf->ttfont('unifont-6.3.20131020.ttf', -encode => 'utf8', -unicodemap => 1);
    # NOTE: all evidence points to PDF::API2 (this version at least) NOT subsetting fonts.
    $bold_unicode_font = $plain_unicode_font;

    my $y_advance = 0;

    $gfx = $page->gfx;
    $gfx->save;
    $gfx->textstart;
    $gfx->translate(50, $y1 - 50);
    $y_advance += 50;

    if($title) {
      $gfx->fillcolor('#000000');
      $gfx->font($bold_unicode_font, $title_font_size);
      $gfx->lead($title_leading);

      while ( $title ) {
          ( $toprint, $title ) = $gfx->text_fill_left($title, $heading_width);
          $gfx->nl;
          $y_advance += $title_leading;
      }
    }

    $gfx->font($plain_unicode_font, $font_size);
    $gfx->lead($leading);

    if($author) {
      my ($width, $lines) = $gfx->write_justified_text($author, $heading_width);
      $y_advance += $leading * $lines;
    }
    if($publisher) {
      my ($width, $lines) = $gfx->write_justified_text($publisher, $heading_width);
      $y_advance += $leading * $lines;
    }

    # Should be done with the Unicode fonts at this point
    $gfx->font($plain_font, $font_size);
    $gfx->nl;
    $y_advance += $leading;

    $gfx->fillcolor('#0000EE');
    my ($handle_width, $handle_lines) = $gfx->write_justified_text("Find this Book Online: " . $self->handle, $heading_width, -underline => 'auto', -strokecolor => '#0000EE');
    my $handle_height = $handle_lines * $leading;
    # y_advance is at the bottom of the first line of the handle; need the top
    my $handle_top = $y1 - $y_advance + $leading;
    $$self{find_online_bbox} = [50, $handle_top - $handle_height, 50 + $handle_width, $handle_top];
    $$self{find_online_url} = $self->handle;

    $y_advance += $handle_height;

    $gfx->textend;
      $gfx->restore;

    my $coverpage_image = qq{$SRV::Globals::gHtmlDir/graphics/hathitrust-logo-stacked-orange-white-rgb-coverpage.jpg};

    my ( $image_w, $image_h ) = imgsize($coverpage_image);
    ( $image_w, $image_h ) = ( $x1 * 0.5, $x1 * 0.5 / ( $image_w / $image_h ));

    my ( $center_x, $center_y ) = ( $x1 / 2, $y1 / 2 );
    my $image_data = $watermark_pdf->image_jpeg($coverpage_image);
    my $image = $page->gfx;
    my $xpos = ( $center_x - ( $image_w / 2 ) );

    # watermark_bottom: position watermarks y_advance units down from top, plus two "lines"
    #
    # watermark_width: greater of image width or twice the width of the larger watermark
    # (see load watermarks above) -- this puts watermarks closer to the center than the default 
    # centered on left half/right half of page, and ensures they don't collide

    my $total_watermark_width = $image_w;
    if(2 * $self->watermark_width > $image_w) {
      $total_watermark_width = 2 * $self->watermark_width;
    }

    $y_advance += $self->watermark_height + $leading;
    my $watermark_bottom = $y1 - $y_advance;
    $self->insert_watermarks($watermark_pdf,$page, $self->watermark_width*2, $watermark_bottom);

    # top of image should be one "line" under the watermark
    my $image_bottom = $watermark_bottom - $leading - $image_h;

    $image->image($image_data, $xpos, $image_bottom, $image_w, $image_h);

    ## add the access statement

    $gfx = $page->gfx;
    $gfx->transform(-translate => [$xpos, $image_bottom - 15]);

    #### TO DO: if there's a stmt_icon, pull and embed
    #### in the PDF.
    # if ( $$self{access_stmts}{stmt_icon} ) {
    # }

    my $access_stmts = $self->access_stmts;

    $gfx->textstart;

    my $stmt_head_font_size = $font_size + 1;
    my $stmt_head_leading = $stmt_head_font_size * 1.25;
    $gfx->font($bold_font, $stmt_head_font_size);
    $gfx->lead($stmt_head_leading);
    $gfx->fillcolor('#0000EE');
    my ($textwidth, $lines) = $gfx->write_justified_text($$access_stmts{stmt_head}, $image_w, -underline => 'auto', -strokecolor => '#0000EE');
    my $textheight = $lines * $stmt_head_leading;
    my $access_stmt_top = $image_bottom - 15 + $stmt_head_font_size;

    $$self{access_stmt_url} = $$access_stmts{stmt_url};
    $$self{access_stmt_link_bbox} = [$xpos, $access_stmt_top, $xpos + $textwidth, $access_stmt_top - $textheight];

    $gfx->nl;

    # # reduce the font size for very long text; will have to be revisited
    # # if the stmt_text runs long
    # if ( length($$self{access_stmts}{stmt_text}) > 960 ) {
    #     $font_size -= 1;
    # }

    $font_size = 8;
    $gfx->font($plain_font, $font_size);
    $gfx->lead($font_size * 1.25);
    $gfx->fillcolor('#6C6C6C');
    $gfx->write_justified_text($$access_stmts{stmt_text}, $image_w);

    $gfx->nl;
    $gfx->write_justified_text($self->generated_text, $image_w);

    $gfx->textend;

}

sub setup_stamp_page {
    my $self = shift;
    my $watermark_pdf = $self->document();

    my $page = $watermark_pdf->page();
    $page->mediabox('Letter');

    $self->insert_generated_message($page);
    $self->insert_watermarks($watermark_pdf,$page);

}

sub load_watermarks {
  my $self = shift;
  my $watermark_pdf = $self->document();

  my $mdpItem = $self->mdpItem; 

  my ( $watermark_digitized, $watermark_original ) = SRV::Utils::get_watermark_filename($mdpItem, { size => 100 });

  my $watermark_height = 0;
  my $watermark_width = 0;
  eval {
    if (defined($watermark_digitized)) {
      $watermark_digitized = $watermark_pdf->image_png("$watermark_digitized.flat.png");
      $watermark_height = $watermark_digitized->height;
      $watermark_width = $watermark_digitized->width;
      $self->watermark_digitized($watermark_digitized);
    }

    if (defined($watermark_original)) {
      $watermark_original = $watermark_pdf->image_png("$watermark_original.flat.png");
      $watermark_height = $watermark_original->height if ( $watermark_original->height > $watermark_height );
      $watermark_width = $watermark_original->width if ( $watermark_original->width > $watermark_width );
      $self->watermark_original($watermark_original);
    }
  };
  if ( my $err = $@ ) {
    print STDERR "!! $err\n";
  }
  $self->watermark_height($watermark_height);
  $self->watermark_width($watermark_width);
}

sub insert_watermarks {
  my $self = shift;
  my $watermark_pdf = shift;
  my $page = shift;

  # optional, width defaults to page width, bottom defaults to bottom of page
  my ( $x0, $y0, $page_width, $page_height ) = $page->get_mediabox;
  my $wm_width = shift || $page_width;
  my $wm_bottom_y = shift || 0;

  $wm_width = $page_width if(!$wm_width);
  
  if ( $self->watermark ) {
    my $center_x;

    my $center_left_image = $page_width/2 - $wm_width / 4;
    my $center_right_image = $page_width/2 + $wm_width / 4;

    eval {
      my $image = $page->gfx();

      if (defined($self->watermark_digitized)) {
        $self->draw_image($image, $self->watermark_digitized, $center_left_image, $wm_bottom_y);
      }

      if (defined($self->watermark_original)) {
        $self->draw_image($image, $self->watermark_original, $center_right_image, $wm_bottom_y);
      }
    };
    if ( my $err = $@ ) {
      print STDERR "!! $err\n";
    }
  }
}

sub draw_image {
    my $self = shift;
    my ( $gfx, $image, $center_x, $y ) = @_;

    my ($wm_w, $wm_h) = ($image->width, $image->height);
    $wm_w *= 0.75;
    $wm_h *= 0.75;
    # center the watermark 30 pixels above the bottom.
    my ( $wm_x, $wm_y );
    $wm_x = $center_x - ($wm_w/2);
    $wm_y = $y;

    eval {
        $gfx->image($image, $wm_x, $wm_y, $wm_w, $wm_h);
    };
    if ( my $err = $@ ) {
        die "COULD NOT ADD WATERMARK\n$err";
    }

}

sub imgsize {
    my ( $filename ) = @_;
    my $info = Image::ExifTool::ImageInfo($filename);
    return ( $$info{ImageWidth}, $$info{ImageHeight} );
}

1;
