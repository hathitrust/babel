#!/bin/bash

prove -lre "perl -I ${SDRROOT}/imgsrv/lib -I ${SDRROOT}/mdp-lib -I ${SDRROOT}/plack-lib -I ${SDRROOT}/slip-lib" imgsrv/t