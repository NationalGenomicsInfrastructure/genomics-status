# Test case 1, Single index standard demux
## Description

- Single index
- Index/read length same as sequencing setup

## Example data

**Run:** [20251117_LH00217_0284_A22GC2NLT1](https://genomics-status.scilifelab.se/flowcells/20251117_LH00217_0284_A22GC2NLT1)

**Project(s) and setup:** [H.JernbergWiklund_25_01](https://genomics-status.scilifelab.se/project/P36906) (85-8-0-215)

**Library method:** Finished library (by user)

**Current bcl2fastq settings:**

LIMS sample sheet:

```bash
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
22GC2NLT1,1,P36906_1001,P36906_1001,Human (Homo sapiens GRCh38),GCTACGCT,TATAGCCT,A__Berggren_25_01,N,85-215,Agneta_Berg,A__Berggren_25_01
22GC2NLT1,1,P36906_1002,P36906_1002,Human (Homo sapiens GRCh38),CGAGGCTG,TATAGCCT,A__Berggren_25_01,N,85-215,Agneta_Berg,A__Berggren_25_01
22GC2NLT1,1,P36906_1003,P36906_1003,Human (Homo sapiens GRCh38),AAGAGGCA,TATAGCCT,A__Berggren_25_01,N,85-215,Agneta_Berg,A__Berggren_25_01
22GC2NLT1,2,P36906_1001,P36906_1001,Human (Homo sapiens GRCh38),GCTACGCT,TATAGCCT,A__Berggren_25_01,N,85-215,Agneta_Berg,A__Berggren_25_01
22GC2NLT1,2,P36906_1002,P36906_1002,Human (Homo sapiens GRCh38),CGAGGCTG,TATAGCCT,A__Berggren_25_01,N,85-215,Agneta_Berg,A__Berggren_25_01
22GC2NLT1,2,P36906_1003,P36906_1003,Human (Homo sapiens GRCh38),AAGAGGCA,TATAGCCT,A__Berggren_25_01,N,85-215,Agneta_Berg,A__Berggren_25_01
```

SampleSheet_0.csv

```bash
[Header]
[Data]
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
22GC2NLT1,1,Sample_P36906_1001,P36906_1001,Human (Homo sapiens GRCh38),GCTACGCT,TATAGCCT,A__Berggren_25_01,N,85-215,Agneta_Berg,A__Berggren_25_01
22GC2NLT1,1,Sample_P36906_1002,P36906_1002,Human (Homo sapiens GRCh38),CGAGGCTG,TATAGCCT,A__Berggren_25_01,N,85-215,Agneta_Berg,A__Berggren_25_01
22GC2NLT1,1,Sample_P36906_1003,P36906_1003,Human (Homo sapiens GRCh38),AAGAGGCA,TATAGCCT,A__Berggren_25_01,N,85-215,Agneta_Berg,A__Berggren_25_01
22GC2NLT1,2,Sample_P36906_1001,P36906_1001,Human (Homo sapiens GRCh38),GCTACGCT,TATAGCCT,A__Berggren_25_01,N,85-215,Agneta_Berg,A__Berggren_25_01
22GC2NLT1,2,Sample_P36906_1002,P36906_1002,Human (Homo sapiens GRCh38),CGAGGCTG,TATAGCCT,A__Berggren_25_01,N,85-215,Agneta_Berg,A__Berggren_25_01
22GC2NLT1,2,Sample_P36906_1003,P36906_1003,Human (Homo sapiens GRCh38),AAGAGGCA,TATAGCCT,A__Berggren_25_01,N,85-215,Agneta_Berg,A__Berggren_25_01
```

bcl2fastq command:

```bash
bcl2fastq --use-bases-mask 1:Y85,I8,Y215 \
--use-bases-mask 2:Y85,I8,Y215 \
--output-dir /srv/ngi_data/sequencing/NovaSeqXPlus/20251117_LH00217_0284_A22GC2NLT1/Demultiplexing_0 \
--sample-sheet /srv/ngi_data/sequencing/NovaSeqXPlus/20251117_LH00217_0284_A22GC2NLT1/SampleSheet_0.csv \
--loading-threads 2 \
--processing-threads 12 \
--writing-threads 2 \
--minimum-trimmed-read-length 0 \
--mask-short-adapter-reads 0 \
--ignore-missing-positions \
--ignore-missing-controls \
--ignore-missing-filter \
--ignore-missing-bcls
```

## Suggestions

### bclconvert command

```bash
bcl-convert \
  --bcl-input-directory /path/to/RunFolder \
  --output-directory Demux_lane1_sub0 \
  --sample-sheet SampleSheet_lane_1_sub0.csv \
  --bcl-sampleproject-subdirectories true \
  --bcl-only-lane 1

bcl-convert \
  --bcl-input-directory /path/to/RunFolder \
  --output-directory Demux_lane2_sub0 \
  --sample-sheet SampleSheet_lane_2_sub0.csv \
  --bcl-sampleproject-subdirectories true \
  --bcl-only-lane 2
```

### SampleSheet_lane_1_sub0.csv

```bash
[Header]
FileFormatVersion,2
RunName,Run_001
InstrumentID,MYSEQ
Date,2025-11-04

[BCLConvert_Settings]
SoftwareVersion,4.4.6
MinimumTrimmedReadLength,0
MaskShortReads,0

[BCLConvert_Data]
Lane,Sample_ID,Sample_Name,index,index2,Sample_Project
1,Sample_P36906_1001,P36906_1001,GCTACGCT,,A__Berggren_25_01
1,Sample_P36906_1002,P36906_1002,CGAGGCTG,,A__Berggren_25_01
1,Sample_P36906_1003,P36906_1003,AAGAGGCA,,A__Berggren_25_01
```

### SampleSheet_lane_2_sub0.csv

```bash
[Header]
FileFormatVersion,2
RunName,Run_001
InstrumentID,MYSEQ
Date,2025-11-04

[BCLConvert_Settings]
SoftwareVersion,4.4.6
MinimumTrimmedReadLength,0
MaskShortReads,0

[BCLConvert_Data]
Lane,Sample_ID,Sample_Name,index,index2,Sample_Project
2,Sample_P36906_1001,P36906_1001,GCTACGCT,,A__Berggren_25_01
2,Sample_P36906_1002,P36906_1002,CGAGGCTG,,A__Berggren_25_01
2,Sample_P36906_1003,P36906_1003,AAGAGGCA,,A__Berggren_25_01
```

# Test case 2, Dual index: Indexes or reads are shorter than the sequencing setup
## Description

- Dual index, one or both indexes/reads are shorter than the sequencing setup
- One or more projects per lane
- One demux

## Example data

**Run:** 20251017_LH00217_0273_A233KCWLT4

**Project(s) and setup:** X.Li_25_01 (43-10-10-50), A.Berggren_25_12 (151-7-7-151)

**Current bcl2fastq settings:**

LIMS sample sheet:

```bash
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
...
233KCWLT4,3,P35504_101,P35504_101,Human (Homo sapiens GRCh38),SI-TS-A7,,A_Berggren_25_01,N,43-50,Agneta_Berg,A_Berggren_25_01
233KCWLT4,3,P35504_201,P35504_201,Human (Homo sapiens GRCh38),SI-TS-B7,,A_Berggren_25_01,N,43-50,Agneta_Berg,A_Berggren_25_01
233KCWLT4,3,P35504_301,P35504_301,Human (Homo sapiens GRCh38),SI-TS-C7,,A_Berggren_25_01,N,43-50,Agneta_Berg,A_Berggren_25_01
233KCWLT4,3,P35504_401,P35504_401,Human (Homo sapiens GRCh38),SI-TS-D7,,A_Berggren_25_01,N,43-50,Agneta_Berg,A_Berggren_25_01
...
233KCWLT4,6,P37556_1001,P37556_1001,Human (Homo sapiens GRCh38),CGCCTCT,CGTTCCT,A__Berggren_25_12,N,151-151,Agneta_Berg,A__Berggren_25_12
233KCWLT4,6,P37556_1002,P37556_1002,Human (Homo sapiens GRCh38),CTTGCGG,CGCCTCA,A__Berggren_25_12,N,151-151,Agneta_Berg,A__Berggren_25_12
233KCWLT4,6,P37556_1003,P37556_1003,Human (Homo sapiens GRCh38),TGGACGT,CAATCGA,A__Berggren_25_12,N,151-151,Agneta_Berg,A__Berggren_25_12
233KCWLT4,6,P37556_1004,P37556_1004,Human (Homo sapiens GRCh38),ATACTGA,CCTTCGC,A__Berggren_25_12,N,151-151,Agneta_Berg,A__Berggren_25_12
233KCWLT4,6,P37556_1005,P37556_1005,Human (Homo sapiens GRCh38),CAGGAAG,CAGGCAA,A__Berggren_25_12,N,151-151,Agneta_Berg,A__Berggren_25_12
233KCWLT4,6,P37556_1006,P37556_1006,Human (Homo sapiens GRCh38),CAATTAC,GCTCCGT,A__Berggren_25_12,N,151-151,Agneta_Berg,A__Berggren_25_12
233KCWLT4,6,P37556_1007,P37556_1007,Human (Homo sapiens GRCh38),CATACCT,AGAGACT,A__Berggren_25_12,N,151-151,Agneta_Berg,A__Berggren_25_12
233KCWLT4,6,P37556_1008,P37556_1008,Human (Homo sapiens GRCh38),TACTTAG,CTGGCCT,A__Berggren_25_12,N,151-151,Agneta_Berg,A__Berggren_25_12
233KCWLT4,6,P37556_1009,P37556_1009,Human (Homo sapiens GRCh38),AAGCTAA,CGCAAGG,A__Berggren_25_12,N,151-151,Agneta_Berg,A__Berggren_25_12
...
```

SampleSheet_0.csv

```bash
[Header]
[Data]
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
233KCWLT4,3,Sample_P35504_101,P35504_101,Human (Homo sapiens GRCh38),TAAACCCTAG,TTCCTATCAG,A_Berggren_25_01,N,43-50,Agneta_Berg,A_Berggren_25_01
233KCWLT4,3,Sample_P35504_201,P35504_201,Human (Homo sapiens GRCh38),CATGCTGCTC,CGGTTTCCAC,A_Berggren_25_01,N,43-50,Agneta_Berg,A_Berggren_25_01
233KCWLT4,3,Sample_P35504_301,P35504_301,Human (Homo sapiens GRCh38),GATCGCGGTA,GACGGTTCCG,A_Berggren_25_01,N,43-50,Agneta_Berg,A_Berggren_25_01
233KCWLT4,3,Sample_P35504_401,P35504_401,Human (Homo sapiens GRCh38),CTAGAAATTG,CGAAAGTAAG,A_Berggren_25_01,N,43-50,Agneta_Berg,A_Berggren_25_01

```

bcl2fastq command for SampleSheet_0.csv:

```bash
bcl2fastq --use-bases-mask 3:Y43N108,I10,I10,Y50N101 \
--use-bases-mask 8:Y28N123,I10,I10,Y90N61 \
--output-dir /srv/ngi_data/sequencing/NovaSeqXPlus/20251017_LH00217_0273_A233KCWLT4/Demultiplexing_0 \
--sample-sheet /srv/ngi_data/sequencing/NovaSeqXPlus/20251017_LH00217_0273_A233KCWLT4/SampleSheet_0.csv \
--loading-threads 2 \
--processing-threads 12 \
--writing-threads 2 \
--minimum-trimmed-read-length 0 \
--mask-short-adapter-reads 0 \
--ignore-missing-positions \
--ignore-missing-controls \
--ignore-missing-filter \
--ignore-missing-bcls
```

SampleSheet_1.csv

```bash
[Header]
[Data]
...
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
233KCWLT4,6,Sample_P37556_1001,P37556_1001,Human (Homo sapiens GRCh38),CGCCTCT,CGTTCCT,A__Berggren_25_12,N,151-151,Agneta_Berg,A__Berggren_25_12
233KCWLT4,6,Sample_P37556_1002,P37556_1002,Human (Homo sapiens GRCh38),CTTGCGG,CGCCTCA,A__Berggren_25_12,N,151-151,Agneta_Berg,A__Berggren_25_12
233KCWLT4,6,Sample_P37556_1003,P37556_1003,Human (Homo sapiens GRCh38),TGGACGT,CAATCGA,A__Berggren_25_12,N,151-151,Agneta_Berg,A__Berggren_25_12
233KCWLT4,6,Sample_P37556_1004,P37556_1004,Human (Homo sapiens GRCh38),ATACTGA,CCTTCGC,A__Berggren_25_12,N,151-151,Agneta_Berg,A__Berggren_25_12
233KCWLT4,6,Sample_P37556_1005,P37556_1005,Human (Homo sapiens GRCh38),CAGGAAG,CAGGCAA,A__Berggren_25_12,N,151-151,Agneta_Berg,A__Berggren_25_12
233KCWLT4,6,Sample_P37556_1006,P37556_1006,Human (Homo sapiens GRCh38),CAATTAC,GCTCCGT,A__Berggren_25_12,N,151-151,Agneta_Berg,A__Berggren_25_12
233KCWLT4,6,Sample_P37556_1007,P37556_1007,Human (Homo sapiens GRCh38),CATACCT,AGAGACT,A__Berggren_25_12,N,151-151,Agneta_Berg,A__Berggren_25_12
233KCWLT4,6,Sample_P37556_1008,P37556_1008,Human (Homo sapiens GRCh38),TACTTAG,CTGGCCT,A__Berggren_25_12,N,151-151,Agneta_Berg,A__Berggren_25_12
233KCWLT4,6,Sample_P37556_1009,P37556_1009,Human (Homo sapiens GRCh38),AAGCTAA,CGCAAGG,A__Berggren_25_12,N,151-151,Agneta_Berg,A__Berggren_25_12
...
```

bcl2fastq command for SampleSheet_1.csv:

```bash
bcl2fastq --use-bases-mask 1:Y151,I10,I10,Y151 \
--use-bases-mask 2:Y151,I8N2,I8N2,Y151 \
--use-bases-mask 4:Y151,I10,I10,Y151 \
--use-bases-mask 5:Y151,I10,I10,Y151 \
--use-bases-mask 6:Y151,I7N3,I7N3,Y151 \
--use-bases-mask 7:Y151,I8N2,I8N2,Y151 \
--output-dir Demultiplexing_1 \
--sample-sheet SampleSheet_1.csv \
--loading-threads 2 \
--processing-threads 12 \
--writing-threads 2 \
--minimum-trimmed-read-length 0 \
--mask-short-adapter-reads 0 \
--ignore-missing-positions \
--ignore-missing-controls \
--ignore-missing-filter \
--ignore-missing-bcls
```

## Suggestions

### bclconvert command

```bash
bcl-convert \
  --bcl-input-directory /path/to/RunFolder \
  --output-directory Demux_lane1_sub0 \
  --sample-sheet SampleSheet_lane_1_sub0.csv \
  --bcl-sampleproject-subdirectories true \
  --sample-name-column-enabled true \
  --bcl-only-lane LANENR
```

### Sample sheet Lane 3

```bash
[Header]
FileFormatVersion,2
RunName,Run_001
InstrumentID,MYSEQ
Date,2025-11-04

[BCLConvert_Settings]
SoftwareVersion,4.4.6
MinimumTrimmedReadLength,0
MaskShortReads,0

[BCLConvert_Data]
Lane,Sample_ID,Sample_Name,index,index2,Sample_Project,**OverrideCycles**
3,Sample_P35504_101,P35504_101,TAAACCCTAG,TTCCTATCAG,A_Berggren_25_01,**Y43N108;I10;I10;Y50N101**
3,Sample_P35504_201,P35504_201,CATGCTGCTC,CGGTTTCCAC,A_Berggren_25_01,**Y43N108;I10;I10;Y50N101**
3,Sample_P35504_301,P35504_301,GATCGCGGTA,GACGGTTCCG,A_Berggren_25_01,**Y43N108;I10;I10;Y50N101**
3,Sample_P35504_401,P35504_401,CTAGAAATTG,CGAAAGTAAG,A_Berggren_25_01,**Y43N108;I10;I10;Y50N101**
```

### Sample sheet Lane 6
```bash
[Header]
FileFormatVersion,2
RunName,Run_001
InstrumentID,MYSEQ
Date,2025-11-04

[BCLConvert_Settings]
SoftwareVersion,4.4.6
MinimumTrimmedReadLength,0
MaskShortReads,0

[BCLConvert_Data]
Lane,Sample_ID,Sample_Name,index,index2,Sample_Project,OverrideCycles
6,Sample_P37556_1001,P37556_1001,CGCCTCT,CGTTCCT,A_Berggren_25_12,Y151;I7N3;I7N3;Y151
6,Sample_P37556_1002,P37556_1002,CTTGCGG,CGCCTCA,A_Berggren_25_12,Y151;I7N3;I7N3;Y151
6,Sample_P37556_1003,P37556_1003,TGGACGT,CAATCGA,A_Berggren_25_12,Y151;I7N3;I7N3;Y151
6,Sample_P37556_1004,P37556_1004,ATACTGA,CCTTCGC,A_Berggren_25_12,Y151;I7N3;I7N3;Y151
```
