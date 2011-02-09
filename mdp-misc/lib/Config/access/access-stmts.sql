-- ---------------------------------------------------------------------
-- Text maintained here for easy editing.  Make changes here then run
-- commands to re-populate access_stmts table. Do not change
-- access_stmts table using mysql client.
-- ---------------------------------------------------------------------
-- ---------------------------------------------------------------------
-- query:
--
-- SELECT stmt_url, stmt_head, stmt_text FROM access_stmts 
--   WHERE access_stmts.stmt_key = 
--     SELECT stmt_key FROM access_stmts_map 
--       WHERE attr=$attr AND source=$source 
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS access_stmts;
CREATE TABLE `access_stmts` (`stmt_key` varchar(32) NOT NULL default '', `stmt_url` text NOT NULL default '', `stmt_head` text NOT NULL default '', `stmt_text` text NOT NULL default '', PRIMARY KEY (`stmt_key`));

INSERT INTO access_stmts
       SET
       stmt_key='pd',
       stmt_url='http://www.hathitrust.org/access_use#pd',
       stmt_head='Public Domain',
       stmt_text='This work is in the Public Domain, meaning that it is not subject to copyright. Users are free to copy, use, and redistribute the work in part or in whole. It is possible that heirs or the estate of the authors of individual portions of the work, such as illustrations, assert copyrights over these portions. Depending on the nature of subsequent use that is made, additional rights may need to be obtained independently of anything we can address.';

INSERT INTO access_stmts
       SET
       stmt_key='pd-google',
       stmt_url='http://www.hathitrust.org/access_use#pd-google',
       stmt_head='Public Domain, Google-digitized',
       stmt_text='This work is in the Public Domain, meaning that it is not subject to copyright. Users are free to copy, use, and redistribute the work in part or in whole. It is possible that heirs or the estate of the authors of individual portions of the work, such as illustrations, assert copyrights over these portions. Depending on the nature of subsequent use that is made, additional rights may need to be obtained independently of anything we can address. The digital images and OCR of this work were produced by Google, Inc. (indicated by a watermark on each page in the PageTurner). Google requests that the images and OCR not be re-hosted, redistributed or used commercially.  The images are provided for educational, scholarly, non-commercial purposes.';

INSERT INTO access_stmts
       SET
       stmt_key='pd-us',
       stmt_url='http://www.hathitrust.org/access_use#pd-us',
       stmt_head='Public Domain in the United States',
       stmt_text='This work is deemed to be in the public domain in the United States of America. It may not be in the public domain in other countries. Copies are provided as a preservation service. Particularly outside of the United States, persons receiving copies should make appropriate efforts to determine the copyright status of the work in their country and use the work accordingly. It is possible that heirs or the estate of the authors of individual portions of the work, such as illustrations, assert copyrights over these portions. Depending on the nature of subsequent use that is made, additional rights may need to be obtained independently of anything we can address.';

INSERT INTO access_stmts
       SET stmt_key='pd-us-google',
       stmt_url='http://www.hathitrust.org/access_use#pd-us-google',
       stmt_head='Public Domain in the United States, Google-digitized',
       stmt_text='his work is deemed to be in the public domain in the United States of America. It may not be in the public domain in other countries. Copies are provided as a preservation service. Particularly outside of the United States, persons receiving copies should make appropriate efforts to determine the copyright status of the work in their country and use the work accordingly. It is possible that heirs or the estate of the authors of individual portions of the work, such as illustrations, assert copyrights over these portions. Depending on the nature of subsequent use that is made, additional rights may need to be obtained independently of anything we can address. The digital images and OCR of this work were produced by Google, Inc. (indicated by a watermark on each page in the PageTurner). Google requests that the images and OCR not be re-hosted, redistributed or used commercially.  The images are provided for educational, scholarly, non-commercial purposes.';

INSERT INTO access_stmts
       SET stmt_key='oa',
       stmt_url='http://www.hathitrust.org/access_use#oa',
       stmt_head='Open Access',
       stmt_text='This work is protected by copyright law. It is made available from HathiTrust with explicit permission of the copyright holder. Permission must be requested from the rights holder for any subsequent use.';

INSERT INTO access_stmts
       SET
       stmt_key='oa-google',
       stmt_url='http://www.hathitrust.org/access_use#oa-google',
       stmt_head='Open Access, Google-digitized',
       stmt_text='This work is protected by copyright law. It is made available from HathiTrust with permission of the copyright holder. Permission must be requested from the rights holder for any subsequent use. The digital images and OCR of this work were produced by Google, Inc. (indicated by a watermark on each page in the PageTurner). Google requests that these images and OCR not be re-hosted, redistributed or used commercially. They are provided for educational, scholarly, non-commercial purposes.';

INSERT INTO access_stmts
       SET
       stmt_key='section108',
       stmt_url='http://www.hathitrust.org/access_use#section108',
       stmt_head='Protected by copyright law',
       stmt_text='This work is protected by copyright law (which includes certain exceptions to the rights of the copyright holder that users may make, such as fair use where applicable under U.S. law). It is made available on a strictly limited basis in accordance with U.S. exceptions to copyright law (e.g., Section 108 provisions or to registered users with print disabilities).  In the absence of an applicable exception, no further reproduction or distribution is permitted by any means without the permission of the copyright holder.';

INSERT INTO access_stmts
       SET
       stmt_key='ic',
       stmt_url='http://www.hathitrust.org/access_use#ic',
       stmt_head='Protected by copyright law',
       stmt_text='This work is protected by copyright law (which includes certain exceptions to the rights of the copyright holder that users may make, such as fair use where applicable under U.S. law).  In the absence of an applicable exception, no further reproduction or distribution is permitted by any means without the permission of the copyright holder.';

INSERT INTO access_stmts
       SET
       stmt_key='cc-by',
       stmt_url='http://www.hathitrust.org/access_use#cc-by',
       stmt_head='Creative Commons Attribution',
       stmt_text='You must attribute this work in the manner specified by the author or licensor (but not in any way that suggests that they endorse you or your use of the work).';

INSERT INTO access_stmts
       SET
       stmt_key='cc-by-nd',
       stmt_url='http://www.hathitrust.org/access_use#cc-by-nd',
       stmt_head='Creative Commons Attribution-NoDerivatives',
       stmt_text='Protected by copyright law. You must attribute this work in the manner specified by the author or licensor (but not in any way that suggests that they endorse you or your use of the work). Only verbatim copies of this  work may be made, distributed, displayed, and performed, not derivative works based upon it.';

INSERT INTO access_stmts
       SET
       stmt_key='cc-by-nc-nd',
       stmt_url='http://www.hathitrust.org/access_use#cc-by-nc-nd',
       stmt_head='Creative Commons Attribution-NonCommercial-NoDerivatives',
       stmt_text='Protected by copyright law. You must attribute this work in the manner specified by the author or licensor (but not in any way that suggests that they endorse you or your use of the work). Only verbatim copies of this  work may be made, distributed, displayed, and performed, not derivative works based upon it. Copies that are made may only be used for non-commercial purposes.';

INSERT INTO access_stmts
       SET
       stmt_key='cc-by-nc',
       stmt_url='http://www.hathitrust.org/access_use#cc-by-nc',
       stmt_head='Creative Commons Attribution-NonCommercial',
       stmt_text='Protected by copyright law. You must attribute this work in the manner specified by the author or licensor (but not in any way that suggests that they endorse you or your use of the work). This work may be copied, distributed, displayed, and performed - and derivative works based upon it - but for non-commercial purposes only.';

INSERT INTO access_stmts
       SET
       stmt_key='cc-by-nc-sa',
       stmt_url='http://www.hathitrust.org/access_use#cc-by-nc-sa',
       stmt_head='Creative Commons Attribution-NonCommercial-ShareAlike',
       stmt_text='Protected by copyright law. You must attribute this work in the manner specified by the author or licensor (but not in any way that suggests that they endorse you or your use of the work). This work may be copied, distributed, displayed, and performed - and derivative works based upon it - but for non-commercial purposes only. If you alter, transform, or build upon this work, you may distribute the resulting work only under the same or similar license to this one.';

INSERT INTO access_stmts
       SET
       stmt_key='cc-by-sa',
       stmt_url='http://www.hathitrust.org/access_use#cc-by-sa',
       stmt_head='Creative Commons Attribution-ShareAlike',
       stmt_text='Protected by copyright law. You must attribute this work in the manner specified by the author or licensor (but not in any way that suggests that they endorse you or your use of the work). If you alter, transform, or build upon this work, you may distribute the resulting work only under the same or similar license to this one.';

