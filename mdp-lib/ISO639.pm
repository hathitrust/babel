package ISO639;

use constant INDEX_BIB => 0;
use constant INDEX_TERM => 1;
use constant INDEX_ALPHA2 => 2;
use constant INDEX_ENGLISH => 3;

our $mapping;

sub alpha2 {
    my ( $bib ) = @_;
    my $map = get_map();
    return $$map{$bib}->[INDEX_ALPHA2];
}

sub rfc5646 {
    my ( $bib ) = @_;
    return alpha2($bib) || $bib;
}

sub get_map {
    unless ( ref($mapping) ) {
        $mapping = {};
        while ( my $line = <DATA> ) {
            chomp $line;
            last if ( $line =~ m,^__END__$, );
            next unless ( $line );
            my ( $bib, $term, $alpha2, $english, $french ) = split(/\|/, $line);
            # $$mapping{$english} = [ $bib, $term, $alpha2, $english ];
            $$mapping{$bib} = [ $bib, $term, $alpha2, $english ];
        }
    }
    return $mapping;
}

1;

__DATA__
aar||aa|Afar
abk||ab|Abkhaz
ace|||Achinese
ach|||Acoli
ada|||Adangme
ady|||Adygei
afa|||Afroasiatic (Other)
afh|||Afrihili (Artificial language)
afr||af|Afrikaans
ain|||Ainu
ajm|||Aljamía
aka||ak|Akan
akk|||Akkadian
alb|sqi|sq|Albanian
ale|||Aleut
alg|||Algonquian (Other)
alt|||Altai
amh||am|Amharic
ang|||English, Old (ca. 450-1100)
anp|||Angika
apa|||Apache languages
ara||ar|Arabic
arc|||Aramaic
arg||an|Aragonese
arm|hye|hy|Armenian
arn|||Mapuche
arp|||Arapaho
art|||Artificial (Other)
arw|||Arawak
asm||as|Assamese
ast|||Bable
ath|||Athapascan (Other)
aus|||Australian languages
ava||av|Avaric
ave||ae|Avestan
awa|||Awadhi
aym||ay|Aymara
aze||az|Azerbaijani
bad|||Banda languages
bai|||Bamileke languages
bak||ba|Bashkir
bal|||Baluchi
bam||bm|Bambara
ban|||Balinese
baq|eus|eu|Basque
bas|||Basa
bat|||Baltic (Other)
bej|||Beja
bel||be|Belarusian
bem|||Bemba
ben||bn|Bengali
ber|||Berber (Other)
bho|||Bhojpuri
bih||bh|Bihari (Other)
bik|||Bikol
bin|||Edo
bis||bi|Bislama
bla|||Siksika
bnt|||Bantu (Other)
bos||bs|Bosnian
bra|||Braj
bre||br|Breton
btk|||Batak
bua|||Buriat
bug|||Bugis
bul||bg|Bulgarian
bur|mya|my|Burmese
byn|||Bilin
cad|||Caddo
cai|||Central American Indian (Other)
car|||Carib
cat||ca|Catalan
cau|||Caucasian (Other)
ceb|||Cebuano
cel|||Celtic (Other)
cha||ch|Chamorro
chb|||Chibcha
che||ce|Chechen
chg|||Chagatai
chi|zho|zh|Chinese
chk|||Chuukese
chm|||Mari
chn|||Chinook jargon
cho|||Choctaw
chp|||Chipewyan
chr|||Cherokee
chu||cu|Church Slavic
chv||cv|Chuvash
chy|||Cheyenne
cmc|||Chamic languages
cop|||Coptic
cor||kw|Cornish
cos||co|Corsican
cpe|||Creoles and Pidgins, English-based (Other)
cpf|||Creoles and Pidgins, French-based (Other)
cpp|||Creoles and Pidgins, Portuguese-based (Other)
cre||cr|Cree
crh|||Crimean Tatar
crp|||Creoles and Pidgins (Other)
csb|||Kashubian
cus|||Cushitic (Other)
cze|ces|cs|Czech
dak|||Dakota
dan||da|Danish
dar|||Dargwa
day|||Dayak
del|||Delaware
den|||Slavey
dgr|||Dogrib
din|||Dinka
div||dv|Divehi
doi|||Dogri
dra|||Dravidian (Other)
dsb|||Lower Sorbian
dua|||Duala
dum|||Dutch, Middle (ca. 1050-1350)
dut|ndl|nl|Dutch
dyu|||Dyula
dzo||dz|Dzongkha
efi|||Efik
egy|||Egyptian
eka|||Ekajuk
elx|||Elamite
eng||en|English
enm|||English, Middle (1100-1500)
epo||eo|Esperanto
esk|||Eskimo languages
est||et|Estonian
ewe||ee|Ewe
ewo|||Ewondo
fan|||Fang
fao||fo|Faroese
fat|||Fanti
fij||fj|Fijian
fil|||Filipino
fin||fi|Finnish
fiu|||Finno-Ugrian (Other)
fon|||Fon
fre|fra|fr|French
frm|||French, Middle (ca. 1300-1600)
fro|||French, Old (ca. 842-1300)
frr|||North Frisian
frs|||East Frisian
fry||fy|Frisian
ful||ff|Fula
fur|||Friulian
gaa|||Gã
gae|||Scottish Gaelix
gay|||Gayo
gba|||Gbaya
gem|||Germanic (Other)
geo|kat|ka|Georgian
ger|deu|de|German
gez|||Ethiopic
gil|||Gilbertese
gla||gd|Scottish Gaelic
gle||ga|Irish
glg||gl|Galician
glv||gv|Manx
gmh|||German, Middle High (ca. 1050-1500)
goh|||German, Old High (ca. 750-1050)
gon|||Gondi
gor|||Gorontalo
got|||Gothic
grb|||Grebo
grc|||Greek, Ancient (to 1453)
gre|ell|el|Greek, Modern (1453- )
grn||gn|Guarani
gsw|||Swiss German
guj||gu|Gujarati
gwi|||Gwich'in
hai|||Haida
hat||ht|Haitian French Creole
hau||ha|Hausa
haw|||Hawaiian
heb||he|Hebrew
her||hz|Herero
hil|||Hiligaynon
him|||Western Pahari languages
hin||hi|Hindi
hit|||Hittite
hmn|||Hmong
hmo||ho|Hiri Motu
hrv||hr|Croatian
hsb|||Upper Sorbian
hun||hu|Hungarian
hup|||Hupa
iba|||Iban
ibo||ig|Igbo
ice|isl|is|Icelandic
ido||io|Ido
iii||ii|Sichuan Yi
ijo|||Ijo
iku||iu|Inuktitut
ile||ie|Interlingue
ilo|||Iloko
ina||ia|Interlingua (International Auxiliary Language Association)
inc|||Indic (Other)
ind||id|Indonesian
ine|||Indo-European (Other)
inh|||Ingush
ipk||ik|Inupiaq
ira|||Iranian (Other)
iro|||Iroquoian (Other)
ita||it|Italian
jav||jv|Javanese
jbo|||Lojban (Artificial language)
jpn||ja|Japanese
jpr|||Judeo-Persian
jrb|||Judeo-Arabic
kaa|||Kara-Kalpak
kab|||Kabyle
kac|||Kachin
kal||kl|Kalâtdlisut
kam|||Kamba
kan||kn|Kannada
kar|||Karen languages
kas||ks|Kashmiri
kau||kr|Kanuri
kaw|||Kawi
kaz||kk|Kazakh
kbd|||Kabardian
kha|||Khasi
khi|||Khoisan (Other)
khm||km|Khmer
kho|||Khotanese
kik||ki|Kikuyu
kin||rw|Kinyarwanda
kir||ky|Kyrgyz
kmb|||Kimbundu
kok|||Konkani
kom||kv|Komi
kon||kg|Kongo
kor||ko|Korean
kos|||Kosraean
kpe|||Kpelle
krc|||Karachay-Balkar
krl|||Karelian
kro|||Kru (Other)
kru|||Kurukh
kua||kj|Kuanyama
kum|||Kumyk
kur||ku|Kurdish
kus|||Kusaie
kut|||Kootenai
lad|||Ladino
lah|||Lahndā
lam|||Lamba (Zambia and Congo)
lan|||Occitan (post 1500)
lao||lo|Lao
lat||la|Latin
lav||lv|Latvian
lez|||Lezgian
lim||li|Limburgish
lin||ln|Lingala
lit||lt|Lithuanian
lol|||Mongo-Nkundu
loz|||Lozi
ltz||lb|Luxembourgish
lua|||Luba-Lulua
lub||lu|Luba-Katanga
lug||lg|Ganda
lui|||Luiseño
lun|||Lunda
luo|||Luo (Kenya and Tanzania)
lus|||Lushai
mac|mkd|mk|Macedonian
mad|||Madurese
mag|||Magahi
mah||mh|Marshallese
mai|||Maithili
mak|||Makasar
mal||ml|Malayalam
man|||Mandingo
mao|mri|mi|Maori
map|||Austronesian (Other)
mar||mr|Marathi
mas|||Maasai
may|msa|ms|Malay
mdf|||Moksha
mdr|||Mandar
men|||Mende
mga|||Irish, Middle (ca. 1100-1550)
mic|||Micmac
min|||Minangkabau
mis|||Miscellaneous languages
mkh|||Mon-Khmer (Other)
mlg||mg|Malagasy
mlt||mt|Maltese
mnc|||Manchu
mni|||Manipuri
mno|||Manobo languages
moh|||Mohawk
mol|||Moldavian
mon||mn|Mongolian
mos|||Mooré
mul|||Multiple languages
mun|||Munda (Other)
mus|||Creek
mwl|||Mirandese
mwr|||Marwari
myn|||Mayan languages
myv|||Erzya
nah|||Nahuatl
nai|||North American Indian (Other)
nap|||Neapolitan Italian
nau||na|Nauru
nav||nv|Navajo
nbl||nr|Ndebele (South Africa)
nde||nd|Ndebele (Zimbabwe)
ndo||ng|Ndonga
nds|||Low German
nep||ne|Nepali
new|||Newari
nia|||Nias
nic|||Niger-Kordofanian (Other)
niu|||Niuean
nno||nn|Norwegian (Nynorsk)
nob||nb|Norwegian (Bokmål)
nog|||Nogai
non|||Old Norse
nor||no|Norwegian
nqo|||N'Ko
nso|||Northern Sotho
nub|||Nubian languages
nwc|||Newari, Old
nya||ny|Nyanja
nym|||Nyamwezi
nyn|||Nyankole
nyo|||Nyoro
nzi|||Nzima
oci||oc|Occitan (post-1500)
oji||oj|Ojibwa
ori||or|Oriya
orm||om|Oromo
osa|||Osage
oss||os|Ossetic
ota|||Turkish, Ottoman
oto|||Otomian languages
paa|||Papuan (Other)
pag|||Pangasinan
pal|||Pahlavi
pam|||Pampanga
pan||pa|Panjabi
pap|||Papiamento
pau|||Palauan
peo|||Old Persian (ca. 600-400 B.C.)
per|fas|fa|Persian
phi|||Philippine (Other)
phn|||Phoenician
pli||pi|Pali
pol||pl|Polish
pon|||Pohnpeian
por||pt|Portuguese
pra|||Prakrit languages
pro|||Provençal (to 1500)
pus||ps|Pushto
que||qu|Quechua
raj|||Rajasthani
rap|||Rapanui
rar|||Rarotongan
roa|||Romance (Other)
roh||rm|Raeto-Romance
rom|||Romani
rum|ron|ro|Romanian
run||rn|Rundi
rup|||Aromanian
rus||ru|Russian
sad|||Sandawe
sag||sg|Sango (Ubangi Creole)
sah|||Yakut
sai|||South American Indian (Other)
sal|||Salishan languages
sam|||Samaritan Aramaic
san||sa|Sanskrit
sas|||Sasak
sat|||Santali
scn|||Sicilian Italian
sco|||Scots
sel|||Selkup
sem|||Semitic (Other)
sga|||Irish, Old (to 1100)
sgn|||Sign languages
shn|||Shan
sid|||Sidamo
sin||si|Sinhalese
sio|||Siouan (Other)
sit|||Sino-Tibetan (Other)
sla|||Slavic (Other)
slo|slk|sk|Slovak
slv||sl|Slovenian
sma|||Southern Sami
sme||se|Northern Sami
smi|||Sami
smj|||Lule Sami
smn|||Inari Sami
smo||sm|Samoan
sms|||Skolt Sami
sna||sn|Shona
snd||sd|Sindhi
snk|||Soninke
sog|||Sogdian
som||so|Somali
son|||Songhai
sot||st|Sotho
spa||es|Spanish
srd||sc|Sardinian
srn|||Sranan
srp||sr|Serbian
srr|||Serer
ssa|||Nilo-Saharan (Other)
ssw||ss|Swazi
suk|||Sukuma
sun||su|Sundanese
sus|||Susu
sux|||Sumerian
swa||sw|Swahili
swe||sv|Swedish
syc|||Syriac
syr|||Syriac, Modern
tah||ty|Tahitian
tai|||Tai (Other)
tam||ta|Tamil
tat||tt|Tatar
tel||te|Telugu
tem|||Temne
ter|||Terena
tet|||Tetum
tgk||tg|Tajik
tgl||tl|Tagalog
tha||th|Thai
tib|bod|bo|Tibetan
tig|||Tigré
tir||ti|Tigrinya
tiv|||Tiv
tkl|||Tokelauan
tlh|||Klingon (Artificial language)
tli|||Tlingit
tmh|||Tamashek
tog|||Tonga (Nyasa)
ton||to|Tongan
tpi|||Tok Pisin
tru|||Truk
tsi|||Tsimshian
tsn||tn|Tswana
tso||ts|Tsonga
tuk||tk|Turkmen
tum|||Tumbuka
tup|||Tupi languages
tur||tr|Turkish
tut|||Altaic (Other)
tvl|||Tuvaluan
twi||tw|Twi
tyv|||Tuvinian
udm|||Udmurt
uga|||Ugaritic
uig||ug|Uighur
ukr||uk|Ukrainian
umb|||Umbundu
und|||Undetermined
urd||ur|Urdu
uzb||uz|Uzbek
vai|||Vai
ven||ve|Venda
vie||vi|Vietnamese
vol||vo|Volapük
vot|||Votic
wak|||Wakashan languages
wal|||Wolayta
war|||Waray
was|||Washoe
wel|cym|cy|Welsh
wen|||Sorbian (Other)
wln||wa|Walloon
wol||wo|Wolof
xal|||Oirat
xho||xh|Xhosa
yao|||Yao (Africa)
yap|||Yapese
yid||yi|Yiddish
yor||yo|Yoruba
ypk|||Yupik languages
zap|||Zapotec
zbl|||Blissymbolics
zen|||Zenaga
zha||za|Zhuang
znd|||Zande languages
zul||zu|Zulu
zun|||Zuni
zxx|||No linguistic content
zza|||Zaza
__END__

