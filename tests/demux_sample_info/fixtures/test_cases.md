# Test case 1 - Single index standard demux
## Description

- Single index
- Index/read length same as sequencing setup

## Example data

**Run:** [20251117_LH00217_0284_A22GC2NLT1](https://genomics-status.scilifelab.se/flowcells/20251117_LH00217_0284_A22GC2NLT1)

**Run Setup (Recipe):** 85-8-0-215

**Project(s) and setup:** [H.JernbergWiklund_25_01](https://genomics-status.scilifelab.se/project/P36906) (85-8-0-215)

**Library method:** Finished library (by user)

**Current bcl2fastq settings:**

### LIMS sample sheet

```csv
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

# Test case 2 - Dual index: Indexes or reads are shorter than the sequencing setup
## Description

- Dual index, one or both indexes/reads are shorter than the sequencing setup
- One or more projects per lane
- One demux

## Example data

**Run:** 20251017_LH00217_0273_A233KCWLT4

**Run Setup (Recipe):** 151-10-10-151

**Project(s) and setup:** X.Li_25_01 (43-10-10-50), A.Berggren_25_12 (151-7-7-151)

**Current bcl2fastq settings:**

### LIMS sample sheet

```csv
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
...
233KCWLT4,3,P35504_101,P35504_101,Human (Homo sapiens GRCh38),SI-TS-A7,,A__Berggren_25_01,N,43-50,Agneta_Berg,A__Berggren_25_01
233KCWLT4,3,P35504_201,P35504_201,Human (Homo sapiens GRCh38),SI-TS-B7,,A__Berggren_25_01,N,43-50,Agneta_Berg,A__Berggren_25_01
233KCWLT4,3,P35504_301,P35504_301,Human (Homo sapiens GRCh38),SI-TS-C7,,A__Berggren_25_01,N,43-50,Agneta_Berg,A__Berggren_25_01
233KCWLT4,3,P35504_401,P35504_401,Human (Homo sapiens GRCh38),SI-TS-D7,,A__Berggren_25_01,N,43-50,Agneta_Berg,A__Berggren_25_01
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
233KCWLT4,3,Sample_P35504_101,P35504_101,Human (Homo sapiens GRCh38),TAAACCCTAG,TTCCTATCAG,A__Berggren_25_01,N,43-50,Agneta_Berg,A__Berggren_25_01
233KCWLT4,3,Sample_P35504_201,P35504_201,Human (Homo sapiens GRCh38),CATGCTGCTC,CGGTTTCCAC,A__Berggren_25_01,N,43-50,Agneta_Berg,A__Berggren_25_01
233KCWLT4,3,Sample_P35504_301,P35504_301,Human (Homo sapiens GRCh38),GATCGCGGTA,GACGGTTCCG,A__Berggren_25_01,N,43-50,Agneta_Berg,A__Berggren_25_01
233KCWLT4,3,Sample_P35504_401,P35504_401,Human (Homo sapiens GRCh38),CTAGAAATTG,CGAAAGTAAG,A__Berggren_25_01,N,43-50,Agneta_Berg,A__Berggren_25_01

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
3,Sample_P35504_101,P35504_101,TAAACCCTAG,TTCCTATCAG,A__Berggren_25_01,R1:Y43N108;I1:I10;I2:I10;R2:Y50N101
3,Sample_P35504_201,P35504_201,CATGCTGCTC,CGGTTTCCAC,A__Berggren_25_01,R1:Y43N108;I1:I10;I2:I10;R2:Y50N101
3,Sample_P35504_301,P35504_301,GATCGCGGTA,GACGGTTCCG,A__Berggren_25_01,R1:Y43N108;I1:I10;I2:I10;R2:Y50N101
3,Sample_P35504_401,P35504_401,CTAGAAATTG,CGAAAGTAAG,A__Berggren_25_01,R1:Y43N108;I1:I10;I2:I10;R2:Y50N101
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
6,Sample_P37556_1001,P37556_1001,CGCCTCT,CGTTCCT,A__Berggren_25_12,R1:Y151;I1:I7N3;I2:I7N3;R2:Y151
6,Sample_P37556_1002,P37556_1002,CTTGCGG,CGCCTCA,A__Berggren_25_12,R1:Y151;I1:I7N3;I2:I7N3;R2:Y151
6,Sample_P37556_1003,P37556_1003,TGGACGT,CAATCGA,A__Berggren_25_12,R1:Y151;I1:I7N3;I2:I7N3;R2:Y151
6,Sample_P37556_1004,P37556_1004,ATACTGA,CCTTCGC,A__Berggren_25_12,R1:Y151;I1:I7N3;I2:I7N3;R2:Y151
```

# Test case 3 - No index
## Description

- No index (PhiX reads will not be filtered and send to user, no undetermined reads)

## Example data

**Run:** 251118_M01548_0652_000000000-GV85B

**Run Setup (Recipe):** 164-0-0-164

**Project and setup:** A.Berggren_25_08 (164-0-0-164)

**Current bcl2fastq settings:**

### LIMS sample sheet

```csv
[Header]
Local Run Manager Analysis Id,76077
Experiment Name,GV85B
Date,2025-11-18
Module,GenerateFASTQ - 3.1.0
Workflow,GenerateFASTQ
Library Prep Kit,Custom
Index Kit,Custom
Description,Production
Chemistry,Default
investigator name,Agneta Berg
project name,A.Berggren_25_08

[Reads]
164
164

[Settings]
onlygeneratefastq,1
filterpcrduplicates,0

[Data]
Sample_ID,Sample_Name,Description,Sample_Project,FCID,Lane,Sample_Ref,Control,Recipe,Operator
P37902_1001,P37902_1001,A__Berggren_25_08,A__Berggren_25_08,GV85B,1,Other (- -),N,164-164,Agneta_Berg
```

SampleSheet_0.csv

```bash
[Header]
Chemistry,Default
Date,2025-11-18
Description,Production
Experiment Name,GV85B
Index Kit,Custom
Library Prep Kit,Custom
Local Run Manager Analysis Id,76077
Module,GenerateFASTQ - 3.1.0
Workflow,GenerateFASTQ
investigator name,Agneta Berg
project name,A.Berggren_25_08
[Data]
Sample_ID,Sample_Name,Description,Sample_Project,FCID,Lane,Sample_Ref,Control,Recipe,Operator
Sample_P37902_1001,P37902_1001,A__Berggren_25_08,A__Berggren_25_08,MS1046442-300V2,1,Other (- -),N,164-164,Agneta Berg
```

bcl2fastq command:

```bash
bcl2fastq --use-bases-mask 1:Y164,Y164 \
--output-dir /srv/ngi_data/sequencing/MiSeq/251118_M01548_0652_000000000-GV85B/Demultiplexing_0 \
--sample-sheet /srv/ngi_data/sequencing/MiSeq/251118_M01548_0652_000000000-GV85B/SampleSheet_0.csv \
--loading-threads 1 \
--processing-threads 8 \
--writing-threads 1 \
--minimum-trimmed-read-length 0 \
--mask-short-adapter-reads 0 \
--ignore-missing-positions \
--ignore-missing-controls \
--ignore-missing-filter \
--ignore-missing-bcls \
--barcode-mismatches 0
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

### Sample sheet

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
1,Sample_P37902_1001,P37902_1001,,,A__Berggren_25_08
```

### Notes

- `--barcode-mismatches 0` for bcl2fastq has been replaced with the sample sheet settings `BarcodeMismatchesIndex1` and `BarcodeMismatchesIndex2` . These can only be specified when index 1/2 is present.
- In bclconvert: When a sample sheet contains one unindexed sample, all reads are placed in the sample FASTQ files (one each for Read 1 and Read 2)

# Test case 4 - Mixed dual and single on one lane
## Description

- Mixed dual and single on one lane

## Example data

**Run:** [20251118_LH00202_0299_B233JTGLT4](https://genomics-status.scilifelab.se/flowcells/20251118_LH00202_0299_B233JTGLT4)

**Run Setup (Recipe):** 151-10-10-151

**Project(s) and setup:** [A.Berggren_25_01](https://genomics-status.scilifelab.se/project/P36203) (151-X-X-151), [B.Bergman_25_01](https://genomics-status.scilifelab.se/project/P36705) (151-X-X-151), [C.Bergkvist_25_01](https://genomics-status.scilifelab.se/project/P37004) (151-8-0-151)

**Current bcl2fastq settings:**

### LIMS sample sheet

```csv
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
233JTGLT4,1,P36203_103,P36203_103,Human (Homo sapiens GRCh38),ACTCTCGA,CTGTACCA,A__Berggren_25_01,N,151-151,Agneta_Berg,A__Berggren_25_01
233JTGLT4,1,P36203_303,P36203_303,Human (Homo sapiens GRCh38),TGAGCTAG,GAACGGTT,A__Berggren_25_01,N,151-151,Agneta_Berg,A__Berggren_25_01
233JTGLT4,1,P36705_101,P36705_101,Human (Homo sapiens GRCh38),GCGCGGTTAA,AAGCTATAGC,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,P36705_102,P36705_102,Human (Homo sapiens GRCh38),TTCCTTGAGG,TAAGACAGCA,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,P36705_103,P36705_103,Human (Homo sapiens GRCh38),GAGTCGCTTC,AGCGAAGATT,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,P36705_104,P36705_104,Human (Homo sapiens GRCh38),GCATAAGATC,GAGAACTGGA,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,P36705_105,P36705_105,Human (Homo sapiens GRCh38),TAGAAGATCG,CGACCAGTGT,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,P36705_106,P36705_106,Human (Homo sapiens GRCh38),AACCTAGTGC,TACAGGTCCT,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,P36705_107,P36705_107,Human (Homo sapiens GRCh38),CGTGTATGTC,GCATCTCTAT,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,P36705_108,P36705_108,Human (Homo sapiens GRCh38),TTCAGATCCA,TGGCATTGGA,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,P36705_109,P36705_109,Human (Homo sapiens GRCh38),CTCACCAGTT,TTGGTGTGTC,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,P36705_110,P36705_110,Human (Homo sapiens GRCh38),ACTAGTAGTC,ACGTACACTC,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,P36705_111,P36705_111,Human (Homo sapiens GRCh38),AATAGACTGC,TCAAGGTCGC,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,P36705_112,P36705_112,Human (Homo sapiens GRCh38),ATGATCAACG,GTATAGCGTC,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,P37004_1001,P37004_1001,Human (Homo sapiens GRCh38),TCAGCGAA,,C__Bergkvist_25_01,N,151-151,Agneta_Berg,C__Bergkvist_25_01
233JTGLT4,1,P37004_1002,P37004_1002,Human (Homo sapiens GRCh38),CCATTGTT,,C__Bergkvist_25_01,N,151-151,Agneta_Berg,C__Bergkvist_25_01
233JTGLT4,1,P37004_1003,P37004_1003,Human (Homo sapiens GRCh38),AGAGGAAT,,C__Bergkvist_25_01,N,151-151,Agneta_Berg,C__Bergkvist_25_01
233JTGLT4,1,P37004_1004,P37004_1004,Human (Homo sapiens GRCh38),CTTCCTTC,,C__Bergkvist_25_01,N,151-151,Agneta_Berg,C__Bergkvist_25_01
233JTGLT4,1,P37004_1005,P37004_1005,Human (Homo sapiens GRCh38),CTTGCAGA,,C__Bergkvist_25_01,N,151-151,Agneta_Berg,C__Bergkvist_25_01
233JTGLT4,1,P37004_1006,P37004_1006,Human (Homo sapiens GRCh38),TCTAGCGA,,C__Bergkvist_25_01,N,151-151,Agneta_Berg,C__Bergkvist_25_01
233JTGLT4,1,P37004_1007,P37004_1007,Human (Homo sapiens GRCh38),TCAACTGT,,C__Bergkvist_25_01,N,151-151,Agneta_Berg,C__Bergkvist_25_01
```

SampleSheet_0.csv

```bash
[Header]
[Data]
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
233JTGLT4,1,Sample_P36203_103,P36203_103,Human (Homo sapiens GRCh38),ACTCTCGA,CTGTACCA,A__Berggren_25_01,N,151-151,Agneta_Berg,A__Berggren_25_01
233JTGLT4,1,Sample_P36203_303,P36203_303,Human (Homo sapiens GRCh38),TGAGCTAG,GAACGGTT,A__Berggren_25_01,N,151-151,Agneta_Berg,A__Berggren_25_01
```

bcl2fastq command 0:

```bash
bcl2fastq **--use-bases-mask 1:Y151,I8N2,I8N2,Y151** \
--use-bases-mask 2:Y151,I10,I10,Y151 \
--use-bases-mask 3:Y151,I8N2,I8N2,Y151 \
--use-bases-mask 4:Y151,I10,I10,Y151 \
--use-bases-mask 5:Y151,I10,I10,Y151 \
--use-bases-mask 6:Y151,I10,I10,Y151 \
--use-bases-mask 8:Y151,I8N2,I8N2,Y151 \
--output-dir /srv/ngi_data/sequencing/NovaSeqXPlus/20251118_LH00202_0299_B233JTGLT4/Demultiplexing_0 \
--sample-sheet /srv/ngi_data/sequencing/NovaSeqXPlus/20251118_LH00202_0299_B233JTGLT4/SampleSheet_0.csv \
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
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
233JTGLT4,1,Sample_P36705_101,P36705_101,Human (Homo sapiens GRCh38),GCGCGGTTAA,AAGCTATAGC,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,Sample_P36705_102,P36705_102,Human (Homo sapiens GRCh38),TTCCTTGAGG,TAAGACAGCA,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,Sample_P36705_103,P36705_103,Human (Homo sapiens GRCh38),GAGTCGCTTC,AGCGAAGATT,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,Sample_P36705_104,P36705_104,Human (Homo sapiens GRCh38),GCATAAGATC,GAGAACTGGA,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,Sample_P36705_105,P36705_105,Human (Homo sapiens GRCh38),TAGAAGATCG,CGACCAGTGT,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,Sample_P36705_106,P36705_106,Human (Homo sapiens GRCh38),AACCTAGTGC,TACAGGTCCT,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,Sample_P36705_107,P36705_107,Human (Homo sapiens GRCh38),CGTGTATGTC,GCATCTCTAT,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,Sample_P36705_108,P36705_108,Human (Homo sapiens GRCh38),TTCAGATCCA,TGGCATTGGA,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,Sample_P36705_109,P36705_109,Human (Homo sapiens GRCh38),CTCACCAGTT,TTGGTGTGTC,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,Sample_P36705_110,P36705_110,Human (Homo sapiens GRCh38),ACTAGTAGTC,ACGTACACTC,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,Sample_P36705_111,P36705_111,Human (Homo sapiens GRCh38),AATAGACTGC,TCAAGGTCGC,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
233JTGLT4,1,Sample_P36705_112,P36705_112,Human (Homo sapiens GRCh38),ATGATCAACG,GTATAGCGTC,B__Bergman_25_01,N,151-151,Agneta_Berg,B__Bergman_25_01
```

bcl2fastq command 1:

```bash
bcl2fastq **--use-bases-mask 1:Y151,I10,I10,Y151** \
--use-bases-mask 3:Y151,I10,I10,Y151 \
--output-dir /srv/ngi_data/sequencing/NovaSeqXPlus/20251118_LH00202_0299_B233JTGLT4/Demultiplexing_1 \
--sample-sheet /srv/ngi_data/sequencing/NovaSeqXPlus/20251118_LH00202_0299_B233JTGLT4/SampleSheet_1.csv \
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

SampleSheet_2.csv

```bash
[Header]
[Data]
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
233JTGLT4,1,Sample_P37004_1001,P37004_1001,Human (Homo sapiens GRCh38),TCAGCGAA,,C__Bergkvist_25_01,N,151-151,Agneta_Berg,C__Bergkvist_25_01
233JTGLT4,1,Sample_P37004_1002,P37004_1002,Human (Homo sapiens GRCh38),CCATTGTT,,C__Bergkvist_25_01,N,151-151,Agneta_Berg,C__Bergkvist_25_01
233JTGLT4,1,Sample_P37004_1003,P37004_1003,Human (Homo sapiens GRCh38),AGAGGAAT,,C__Bergkvist_25_01,N,151-151,Agneta_Berg,C__Bergkvist_25_01
233JTGLT4,1,Sample_P37004_1004,P37004_1004,Human (Homo sapiens GRCh38),CTTCCTTC,,C__Bergkvist_25_01,N,151-151,Agneta_Berg,C__Bergkvist_25_01
233JTGLT4,1,Sample_P37004_1005,P37004_1005,Human (Homo sapiens GRCh38),CTTGCAGA,,C__Bergkvist_25_01,N,151-151,Agneta_Berg,C__Bergkvist_25_01
233JTGLT4,1,Sample_P37004_1006,P37004_1006,Human (Homo sapiens GRCh38),TCTAGCGA,,C__Bergkvist_25_01,N,151-151,Agneta_Berg,C__Bergkvist_25_01
233JTGLT4,1,Sample_P37004_1007,P37004_1007,Human (Homo sapiens GRCh38),TCAACTGT,,C__Bergkvist_25_01,N,151-151,Agneta_Berg,C__Bergkvist_25_01
```

bcl2fastq command 2:

```bash
bcl2fastq **--use-bases-mask 1:Y151,I8N2,N10,Y151** \
--use-bases-mask 7:Y151,I8N2,N10,Y151 \
--output-dir /srv/ngi_data/sequencing/NovaSeqXPlus/20251118_LH00202_0299_B233JTGLT4/Demultiplexing_2 \
--sample-sheet /srv/ngi_data/sequencing/NovaSeqXPlus/20251118_LH00202_0299_B233JTGLT4/SampleSheet_2.csv \
--loading-threads 2 \
--processing-threads 12 \
--writing-threads 2 \
--minimum-trimmed-read-length 0 \
--mask-short-adapter-reads 0 \
--ignore-missing-positions \
--ignore-missing-controls \
--ignore-missing-filter \
--ignore-missing-bcls \
**--barcode-mismatches 0**
```

## Suggestions

### bclconvert command 0

```bash
bcl-convert \
  --bcl-input-directory /path/to/RunFolder \
  --output-directory Demux_lane1_sub0 \
  --sample-sheet SampleSheet_lane_1_sub0.csv \
  --bcl-sampleproject-subdirectories true \
  --sample-name-column-enabled true \
  --bcl-only-lane 1
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
Lane,Sample_ID,Sample_Name,index,index2,Sample_Project,OverrideCycles,BarcodeMismatchesIndex1,BarcodeMismatchesIndex2
1,Sample_P36203_103,P36203_103,ACTCTCGA,CTGTACCA,A__Berggren_25_01,R1:Y151;I1:I8N2;I2:I8N2;R2:Y151,1,1
1,Sample_P36203_303,P36203_303,TGAGCTAG,GAACGGTT,A__Berggren_25_01,R1:Y151;I1:I8N2;I2:I8N2;R2:Y151,1,1
1,Sample_P36705_101,P36705_101,GCGCGGTTAA,AAGCTATAGC,B__Bergman_25_01,R1:Y151;I1:I10;I2:I10;R2:Y151,1,1
1,Sample_P36705_102,P36705_102,TTCCTTGAGG,TAAGACAGCA,B__Bergman_25_01,R1:Y151;I1:I10;I2:I10;R2:Y151,1,1
1,Sample_P36705_103,P36705_103,GAGTCGCTTC,AGCGAAGATT,B__Bergman_25_01,R1:Y151;I1:I10;I2:I10;R2:Y151,1,1
1,Sample_P36705_104,P36705_104,GCATAAGATC,GAGAACTGGA,B__Bergman_25_01,R1:Y151;I1:I10;I2:I10;R2:Y151,1,1
1,Sample_P36705_105,P36705_105,TAGAAGATCG,CGACCAGTGT,B__Bergman_25_01,R1:Y151;I1:I10;I2:I10;R2:Y151,1,1
1,Sample_P36705_106,P36705_106,AACCTAGTGC,TACAGGTCCT,B__Bergman_25_01,R1:Y151;I1:I10;I2:I10;R2:Y151,1,1
1,Sample_P36705_107,P36705_107,CGTGTATGTC,GCATCTCTAT,B__Bergman_25_01,R1:Y151;I1:I10;I2:I10;R2:Y151,1,1
1,Sample_P36705_108,P36705_108,TTCAGATCCA,TGGCATTGGA,B__Bergman_25_01,R1:Y151;I1:I10;I2:I10;R2:Y151,1,1
1,Sample_P36705_109,P36705_109,CTCACCAGTT,TTGGTGTGTC,B__Bergman_25_01,R1:Y151;I1:I10;I2:I10;R2:Y151,1,1
1,Sample_P36705_110,P36705_110,ACTAGTAGTC,ACGTACACTC,B__Bergman_25_01,R1:Y151;I1:I10;I2:I10;R2:Y151,1,1
1,Sample_P36705_111,P36705_111,AATAGACTGC,TCAAGGTCGC,B__Bergman_25_01,R1:Y151;I1:I10;I2:I10;R2:Y151,1,1
1,Sample_P36705_112,P36705_112,ATGATCAACG,GTATAGCGTC,B__Bergman_25_01,R1:Y151;I1:I10;I2:I10;R2:Y151,1,1
1,Sample_P37004_1001,P37004_1001,TCAGCGAA,,C__Bergkvist_25_01,R1:Y151;I1:I8N2;I2:N10;R2:Y151,0,
1,Sample_P37004_1002,P37004_1002,CCATTGTT,,C__Bergkvist_25_01,R1:Y151;I1:I8N2;I2:N10;R2:Y151,0,
1,Sample_P37004_1003,P37004_1003,AGAGGAAT,,C__Bergkvist_25_01,R1:Y151;I1:I8N2;I2:N10;R2:Y151,0,
1,Sample_P37004_1004,P37004_1004,CTTCCTTC,,C__Bergkvist_25_01,R1:Y151;I1:I8N2;I2:N10;R2:Y151,0,
1,Sample_P37004_1005,P37004_1005,CTTGCAGA,,C__Bergkvist_25_01,R1:Y151;I1:I8N2;I2:N10;R2:Y151,0,
1,Sample_P37004_1006,P37004_1006,TCTAGCGA,,C__Bergkvist_25_01,R1:Y151;I1:I8N2;I2:N10;R2:Y151,0,
1,Sample_P37004_1007,P37004_1007,TCAACTGT,,C__Bergkvist_25_01,R1:Y151;I1:I8N2;I2:N10;R2:Y151,0,
```


# Test case 5 - Single index: no mismatches allowed
## Description

- Single index (sequencing setup = project setup)
- One or more projects per lane
- No mismatches allowed

## Example data

**Run:** [20251118_LH00202_0299_B233JTGLT4](https://genomics-status.scilifelab.se/flowcells/20251118_LH00202_0299_B233JTGLT4)

**Run Setup (Recipe):** 151-10-10-151

**Run:** [20251118_LH00202_0299_B233JTGLT4](https://genomics-status.scilifelab.se/flowcells/20251118_LH00202_0299_B233JTGLT4)

**Project(s) and setup:** [A.Berggren_25_02](https://genomics-status.scilifelab.se/project/P37869) (151-8-0-151)

**Current bcl2fastq settings:**

### LIMS sample sheet

```csv
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
233JTGLT4,7,P37869_1001,P37869_1001,Other (- -),TTACCGAC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1002,P37869_1002,Other (- -),AGTGACCT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1003,P37869_1003,Other (- -),TCGGATTC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1004,P37869_1004,Other (- -),CAAGGTAC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1005,P37869_1005,Other (- -),TCCTCATG,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1006,P37869_1006,Other (- -),GTCAGTCA,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1007,P37869_1007,Other (- -),CGAATACG,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1008,P37869_1008,Other (- -),TCTAGGAG,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1009,P37869_1009,Other (- -),CGCAACTA,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1010,P37869_1010,Other (- -),CGTATCTC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1011,P37869_1011,Other (- -),GTACACCT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1012,P37869_1012,Other (- -),CGGCATTA,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1013,P37869_1013,Other (- -),TCGTCTGA,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1014,P37869_1014,Other (- -),AGCCTATC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1015,P37869_1015,Other (- -),CTGTACCA,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1016,P37869_1016,Other (- -),AGACCTTG,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1017,P37869_1017,Other (- -),AGGATAGC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1018,P37869_1018,Other (- -),CCTTCCAT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1019,P37869_1019,Other (- -),GTCCTTGA,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1020,P37869_1020,Other (- -),TGCGTAAC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1021,P37869_1021,Other (- -),CACAGACT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1022,P37869_1022,Other (- -),TTACGTGC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1023,P37869_1023,Other (- -),CCAAGGTT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1024,P37869_1024,Other (- -),CACGCAAT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1025,P37869_1025,Other (- -),TTCCAGGT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1026,P37869_1026,Other (- -),TCATCTCC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1027,P37869_1027,Other (- -),GAGAGTAC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1028,P37869_1028,Other (- -),GTCGTTAC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1029,P37869_1029,Other (- -),GGAGGAAT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1030,P37869_1030,Other (- -),AGGAACAC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
```

SampleSheet_2.csv

```bash
[Header]
[Data]
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
233JTGLT4,7,Sample_P37869_1001,P37869_1001,Other (- -),TTACCGAC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1002,P37869_1002,Other (- -),AGTGACCT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1003,P37869_1003,Other (- -),TCGGATTC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1004,P37869_1004,Other (- -),CAAGGTAC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1005,P37869_1005,Other (- -),TCCTCATG,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
...
```

bcl2fastq command:

```bash
bcl2fastq --use-bases-mask 1:Y151,I8N2,N10,Y151 \
**--use-bases-mask 7:Y151,I8N2,N10,Y151** \
--output-dir /srv/ngi_data/sequencing/NovaSeqXPlus/20251118_LH00202_0299_B233JTGLT4/Demultiplexing_2 \
--sample-sheet /srv/ngi_data/sequencing/NovaSeqXPlus/20251118_LH00202_0299_B233JTGLT4/SampleSheet_2.csv \
--loading-threads 2 \
--processing-threads 12 \
--writing-threads 2 \
--minimum-trimmed-read-length 0 \
--mask-short-adapter-reads 0 \
--ignore-missing-positions \
--ignore-missing-controls \
--ignore-missing-filter \
--ignore-missing-bcls \
**--barcode-mismatches 0**
```

## Suggestions

### bclconvert command

```bash
bcl-convert \
  --bcl-input-directory /path/to/RunFolder \
  --output-directory Demux_lane7_sub0 \
  --sample-sheet SampleSheet_lane_7_sub0.csv \
  --bcl-sampleproject-subdirectories true \
  --sample-name-column-enabled true \
  --bcl-only-lane 7
```

### Sample sheet

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
**BarcodeMismatchesIndex1,0**

[BCLConvert_Data]
Lane,Sample_ID,Sample_Name,index,index2,Sample_Project,OverrideCycles
7,Sample_P37869_1001,P37869_1001,TTACCGAC,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1002,P37869_1002,AGTGACCT,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1003,P37869_1003,TCGGATTC,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1004,P37869_1004,CAAGGTAC,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1005,P37869_1005,TCCTCATG,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
...
```

# Test case 6 - Special indexes that get automatically replaced (10X single cell) [SKIP]

## Description

- Special indexes that get automatically replaced (single cell, usually 10X and SmartSeq, also visium?) and changes the base mask
- Change name to index sequences in sample sheet
- Individual indexes into one sample
- R3 output to fastq
- **Description for demux with bclconvert from 10X:**

[Direct Demultiplexing with Illumina Software | Official 10x Genomics Support](https://www.10xgenomics.com/support/software/cell-ranger-atac/latest/analysis/inputs/direct-demultiplexing-with-illumina-software#demultiplexing-with-bcl-convert-76de9a)

- Same as described in “[UMIs: output to file](https://www.notion.so/UMIs-output-to-file-2a7274e6d51680b9bccec458b8904b46?pvs=21)” (Test case 11)

# Test case 7 - Dual index: standard demux
## Description

## Example data

**Run: [20251223_LH00188_0343_A23FNTJLT3](https://genomics-status.scilifelab.se/flowcells/20251223_LH00188_0343_A23FNTJLT3)**

**Run Setup (Recipe):** 151-10-10-151
## Example data

**Run: [20251223_LH00188_0343_A23FNTJLT3](https://genomics-status.scilifelab.se/flowcells/20251223_LH00188_0343_A23FNTJLT3)**

**Project(s) and setup: [A.Berggren_25_03](https://genomics-status.scilifelab.se/project/P38454)** (151-10-10-151)

**Current bcl2fastq settings:**

### LIMS sample sheet

```csv
[Data]
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
...
23FNTJLT3,4,P38454_1001,P38454_1001,Other (- -),GAACTGAGCG,CGCTCCACGA,A__Berggren_25_03,N,151-151,Agneta_Berg,A__Berggren_25_03
23FNTJLT3,4,P38454_1002,P38454_1002,Other (- -),AGGTCAGATA,TATCTTGTAG,A__Berggren_25_03,N,151-151,Agneta_Berg,A__Berggren_25_03
23FNTJLT3,4,P38454_1003,P38454_1003,Other (- -),CGTCTCATAT,AGCTACTATA,A__Berggren_25_03,N,151-151,Agneta_Berg,A__Berggren_25_03
23FNTJLT3,4,P38454_1004,P38454_1004,Other (- -),ATTCCATAAG,CCACCAGGCA,A__Berggren_25_03,N,151-151,Agneta_Berg,A__Berggren_25_03
23FNTJLT3,4,P38454_1005,P38454_1005,Other (- -),GACGAGATTA,AGGATAATGT,A__Berggren_25_03,N,151-151,Agneta_Berg,A__Berggren_25_03
23FNTJLT3,4,P38454_1006,P38454_1006,Other (- -),AACATCGCGC,ACAAGTGGAC,A__Berggren_25_03,N,151-151,Agneta_Berg,A__Berggren_25_03
23FNTJLT3,4,P38454_1007,P38454_1007,Other (- -),CTAGTGCTCT,TACTGTTCCA,A__Berggren_25_03,N,151-151,Agneta_Berg,A__Berggren_25_03
23FNTJLT3,4,P38454_1008,P38454_1008,Other (- -),GATCAAGGCA,ATTAACAAGG,A__Berggren_25_03,N,151-151,Agneta_Berg,A__Berggren_25_03
...
```

SampleSheet_1.csv

```bash
[Header]
[Data]
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
...
23FNTJLT3,4,Sample_P38454_1001,P38454_1001,Other (- -),GAACTGAGCG,CGCTCCACGA,A__Berggren_25_03,N,151-151,Agneta_Berg,A__Berggren_25_03
23FNTJLT3,4,Sample_P38454_1002,P38454_1002,Other (- -),AGGTCAGATA,TATCTTGTAG,A__Berggren_25_03,N,151-151,Agneta_Berg,A__Berggren_25_03
23FNTJLT3,4,Sample_P38454_1003,P38454_1003,Other (- -),CGTCTCATAT,AGCTACTATA,A__Berggren_25_03,N,151-151,Agneta_Berg,A__Berggren_25_03
23FNTJLT3,4,Sample_P38454_1004,P38454_1004,Other (- -),ATTCCATAAG,CCACCAGGCA,A__Berggren_25_03,N,151-151,Agneta_Berg,A__Berggren_25_03
23FNTJLT3,4,Sample_P38454_1005,P38454_1005,Other (- -),GACGAGATTA,AGGATAATGT,A__Berggren_25_03,N,151-151,Agneta_Berg,A__Berggren_25_03
23FNTJLT3,4,Sample_P38454_1006,P38454_1006,Other (- -),AACATCGCGC,ACAAGTGGAC,A__Berggren_25_03,N,151-151,Agneta_Berg,A__Berggren_25_03
23FNTJLT3,4,Sample_P38454_1007,P38454_1007,Other (- -),CTAGTGCTCT,TACTGTTCCA,A__Berggren_25_03,N,151-151,Agneta_Berg,A__Berggren_25_03
23FNTJLT3,4,Sample_P38454_1008,P38454_1008,Other (- -),GATCAAGGCA,ATTAACAAGG,A__Berggren_25_03,N,151-151,Agneta_Berg,A__Berggren_25_03
...
```

bcl2fastq command:

```bash
bcl2fastq \
--use-bases-mask 2:Y28N123,I8N2,I8N2,Y28N123 \
--use-bases-mask 3:Y28N123,I8N2,I8N2,Y28N123 \
--use-bases-mask 4:Y151,I10,I10,Y151 \
--use-bases-mask 7:Y151,I7N3,I7N3,Y151 \
--use-bases-mask 8:Y151,I10,I10,Y151 \
--output-dir /srv/ngi_data/sequencing/NovaSeqXPlus/20251223_LH00188_0343_A23FNTJLT3/Demultiplexing_2 \
--sample-sheet /srv/ngi_data/sequencing/NovaSeqXPlus/20251223_LH00188_0343_A23FNTJLT3/SampleSheet_2.csv \
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
  --bcl-only-lane 1
```

### Sample sheet

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
4,Sample_P38454_1001,P38454_1001,GAACTGAGCG,CGCTCCACGA,A__Berggren_25_03
4,Sample_P38454_1002,P38454_1002,AGGTCAGATA,TATCTTGTAG,A__Berggren_25_03
4,Sample_P38454_1003,P38454_1003,CGTCTCATAT,AGCTACTATA,A__Berggren_25_03
4,Sample_P38454_1004,P38454_1004,ATTCCATAAG,CCACCAGGCA,A__Berggren_25_03
4,Sample_P38454_1005,P38454_1005,GACGAGATTA,AGGATAATGT,A__Berggren_25_03
4,Sample_P38454_1006,P38454_1006,AACATCGCGC,ACAAGTGGAC,A__Berggren_25_03
4,Sample_P38454_1007,P38454_1007,CTAGTGCTCT,TACTGTTCCA,A__Berggren_25_03
4,Sample_P38454_1008,P38454_1008,GATCAAGGCA,ATTAACAAGG,A__Berggren_25_03
```

# Test case 8 - Special indexes that get automatically replaced (SmartSeq)

## Description

- Special indexes that get automatically replaced (SmartSeq) and changes the base mask
    - **Change name to index sequences in sample sheet**
- Aggregation of individual samples happens somewhere
    - **BCL Convert automatically pools reads from all rows sharing the same Sample ID into a single set of output FASTQ files.**
- I1 and I2 are output to separate fastq files
- Note in TACA for MiSeq: “Note that the index 2 of 10X or Smart-seq dual indexes will be converted to RC”

## Example data

**Run: [20250321_LH00217_0179_A22YMHFLT3](https://genomics-status.scilifelab.se/flowcells/20250321_A22YMHFLT3)**

**Run Setup (Recipe):** 151-10-10-151

**Project(s) and setup:** [A.Berggren_23_01](https://genomics-status.scilifelab.se/project/P29904) (85-10-10-133)

**Current bcl2fastq settings:**

### LIMS sample sheet
This example uses the first 5 and last 5 index sequences for each named index (SMARTSEQ3-23F and SMARTSEQ3-1G) from the Smart-seq3.csv configuration file.
```csv
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
22YMHFLT3,1,P29904_8007,P29904_8007,Human (Homo sapiens GRCh38),SMARTSEQ3-23F,,A__Berggren_23_01,N,85-10-10-133,Agneta_Berg,A__Berggren_23_01
22YMHFLT3,1,P29904_8009,P29904_8009,Human (Homo sapiens GRCh38),SMARTSEQ3-1G,,A__Berggren_23_01,N,85-10-10-133,Agneta_Berg,A__Berggren_23_01
```

SampleSheet_1.csv

```bash
[Header]
[Data]
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
22YMHFLT3,1,Sample_P29904_8007,P29904_8007,Human (Homo sapiens GRCh38),TGACACCGTA,TTGAGAGACA,A__Berggren_23_01,N,85-133,Agneta_Berg,A__Berggren_23_01
22YMHFLT3,1,Sample_P29904_8007,P29904_8007,Human (Homo sapiens GRCh38),TGACCATGAA,TTGAGAGACA,A__Berggren_23_01,N,85-133,Agneta_Berg,A__Berggren_23_01
22YMHFLT3,1,Sample_P29904_8007,P29904_8007,Human (Homo sapiens GRCh38),TTATGGCCTT,TTGAGAGACA,A__Berggren_23_01,N,85-133,Agneta_Berg,A__Berggren_23_01
22YMHFLT3,1,Sample_P29904_8007,P29904_8007,Human (Homo sapiens GRCh38),TTAGGCATCC,TTGAGAGACA,A__Berggren_23_01,N,85-133,Agneta_Berg,A__Berggren_23_01
22YMHFLT3,1,Sample_P29904_8007,P29904_8007,Human (Homo sapiens GRCh38),TCGTGAAGCG,TTGAGAGACA,A__Berggren_23_01,N,85-133,Agneta_Berg,A__Berggren_23_01
22YMHFLT3,1,Sample_P29904_8007,P29904_8007,Human (Homo sapiens GRCh38),CAAGGACATC,TTGTGTGCGT,A__Berggren_23_01,N,85-133,Agneta_Berg,A__Berggren_23_01
22YMHFLT3,1,Sample_P29904_8007,P29904_8007,Human (Homo sapiens GRCh38),CCGACGCATT,TTGTGTGCGT,A__Berggren_23_01,N,85-133,Agneta_Berg,A__Berggren_23_01
22YMHFLT3,1,Sample_P29904_8007,P29904_8007,Human (Homo sapiens GRCh38),TTCGCACGCA,TTGTGTGCGT,A__Berggren_23_01,N,85-133,Agneta_Berg,A__Berggren_23_01
22YMHFLT3,1,Sample_P29904_8007,P29904_8007,Human (Homo sapiens GRCh38),TCTGCGTTAA,TTGTGTGCGT,A__Berggren_23_01,N,85-133,Agneta_Berg,A__Berggren_23_01
22YMHFLT3,1,Sample_P29904_8007,P29904_8007,Human (Homo sapiens GRCh38),TAGAGAGATG,TTGTGTGCGT,A__Berggren_23_01,N,85-133,Agneta_Berg,A__Berggren_23_01
22YMHFLT3,1,Sample_P29904_8009,P29904_8009,Human (Homo sapiens GRCh38),CACAGCAAGA,CGCGTACCAA,A__Berggren_23_01,N,85-133,Agneta_Berg,A__Berggren_23_01
22YMHFLT3,1,Sample_P29904_8009,P29904_8009,Human (Homo sapiens GRCh38),CGATACTAGT,CGCGTACCAA,A__Berggren_23_01,N,85-133,Agneta_Berg,A__Berggren_23_01
22YMHFLT3,1,Sample_P29904_8009,P29904_8009,Human (Homo sapiens GRCh38),CGGTAAGTGG,CGCGTACCAA,A__Berggren_23_01,N,85-133,Agneta_Berg,A__Berggren_23_01
22YMHFLT3,1,Sample_P29904_8009,P29904_8009,Human (Homo sapiens GRCh38),TTCTTAAGCC,CGCGTACCAA,A__Berggren_23_01,N,85-133,Agneta_Berg,A__Berggren_23_01
22YMHFLT3,1,Sample_P29904_8009,P29904_8009,Human (Homo sapiens GRCh38),CGCAGACAAC,CGCGTACCAA,A__Berggren_23_01,N,85-133,Agneta_Berg,A__Berggren_23_01
22YMHFLT3,1,Sample_P29904_8009,P29904_8009,Human (Homo sapiens GRCh38),TTGGCCACGA,TTAGTGGTGC,A__Berggren_23_01,N,85-133,Agneta_Berg,A__Berggren_23_01
22YMHFLT3,1,Sample_P29904_8009,P29904_8009,Human (Homo sapiens GRCh38),TTCCACCACC,TTAGTGGTGC,A__Berggren_23_01,N,85-133,Agneta_Berg,A__Berggren_23_01
22YMHFLT3,1,Sample_P29904_8009,P29904_8009,Human (Homo sapiens GRCh38),TCAGGTGGTC,TTAGTGGTGC,A__Berggren_23_01,N,85-133,Agneta_Berg,A__Berggren_23_01
22YMHFLT3,1,Sample_P29904_8009,P29904_8009,Human (Homo sapiens GRCh38),TGTGGAGGAC,TTAGTGGTGC,A__Berggren_23_01,N,85-133,Agneta_Berg,A__Berggren_23_01
22YMHFLT3,1,Sample_P29904_8009,P29904_8009,Human (Homo sapiens GRCh38),TTATCCGGTC,TTAGTGGTGC,A__Berggren_23_01,N,85-133,Agneta_Berg,A__Berggren_23_01
```

bcl2fastq command:

```bash
Not found
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
  --bcl-only-lane 1
```

### Sample sheet

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
**CreateFastqForIndexReads,1**

[BCLConvert_Data]
Lane,Sample_ID,Sample_Name,index,index2,Sample_Project,**OverrideCycles**
1,Sample_P29904_8007,P29904_8007,TAGAGAGATG,TTGTGTGCGT,A__Berggren_23_01,R1:Y85N66;I1:I10;I2:I10;R2:Y133N18
1,Sample_P29904_8007,P29904_8007,TGACACCGTA,TTGAGAGACA,A__Berggren_23_01,R1:Y85N66;I1:I10;I2:I10;R2:Y133N18
...
```

# Test case 9 - UMIs: Samples with and without UMIs in the same lane [SKIP]


# Test case 10 - UMIs: output in header [SKIP]


# Test case 11 - UMIs: output to file
## Description

- Is [**A.Berggren_25_03](https://genomics-status.scilifelab.se/project/P36052)** an example of this?

## Example data

**Run: [20251111_LH00202_0295_A235WFLLT3](https://genomics-status.scilifelab.se/flowcells/20251111_LH00202_0295_A235WFLLT3)**

**Run Setup (Recipe):** 151-10-24-151

**Project(s) and setup: [A.Berggren_25_03](https://genomics-status.scilifelab.se/project/P36052)**  (50-8-24-49), Library method: 10X Chromium: Multiome


**Current bcl2fastq settings:**

### LIMS sample sheet

```csv
[Data]
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
...
235WFLLT3,4,P36052_101,P36052_101,Human (Homo sapiens GRCh38),**SI-NA-A2**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,P36052_102,P36052_102,Human (Homo sapiens GRCh38),**SI-NA-C2**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,P36052_103,P36052_103,Human (Homo sapiens GRCh38),**SI-NA-B2**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,P36052_104,P36052_104,Human (Homo sapiens GRCh38),**SI-NA-D2**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,P36052_201,P36052_201,Human (Homo sapiens GRCh38),**SI-NA-E2**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
...
```

SampleSheet_0.csv

```bash
[Header]
[Data]
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
235WFLLT3,4,Sample_P36052_101,P36052_101,Human (Homo sapiens GRCh38),**TCTTAGGC**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,Sample_P36052_101,P36052_101,Human (Homo sapiens GRCh38),**AGCCCTTT**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,Sample_P36052_101,P36052_101,Human (Homo sapiens GRCh38),**CAAGTCCA**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,Sample_P36052_101,P36052_101,Human (Homo sapiens GRCh38),**GTGAGAAG**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,Sample_P36052_102,P36052_102,Human (Homo sapiens GRCh38),**TGCTCTGT**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,Sample_P36052_102,P36052_102,Human (Homo sapiens GRCh38),**AATCACTA**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,Sample_P36052_102,P36052_102,Human (Homo sapiens GRCh38),**CCGAGAAC**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,Sample_P36052_102,P36052_102,Human (Homo sapiens GRCh38),**GTAGTGCG**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,Sample_P36052_103,P36052_103,Human (Homo sapiens GRCh38),**TTAGATTG**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,Sample_P36052_103,P36052_103,Human (Homo sapiens GRCh38),**AAGTTGAT**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,Sample_P36052_103,P36052_103,Human (Homo sapiens GRCh38),**CCCACCCA**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,Sample_P36052_103,P36052_103,Human (Homo sapiens GRCh38),**GGTCGAGC**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,Sample_P36052_104,P36052_104,Human (Homo sapiens GRCh38),**TGTGATGC**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,Sample_P36052_104,P36052_104,Human (Homo sapiens GRCh38),**ACATTCCG**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,Sample_P36052_104,P36052_104,Human (Homo sapiens GRCh38),**CTGCGGTA**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,Sample_P36052_104,P36052_104,Human (Homo sapiens GRCh38),**GACACAAT**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,Sample_P36052_201,P36052_201,Human (Homo sapiens GRCh38),**TCATCAAG**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,Sample_P36052_201,P36052_201,Human (Homo sapiens GRCh38),**AGGCTGGT**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,Sample_P36052_201,P36052_201,Human (Homo sapiens GRCh38),**CACAACTA**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
235WFLLT3,4,Sample_P36052_201,P36052_201,Human (Homo sapiens GRCh38),**GTTGGTCC**,,A__Berggren_25_03,N,50-49,Agneta_Berg,A__Berggren_25_03
```

bcl2fastq command:

```bash
bcl2fastq **--use-bases-mask 4:Y50N101,I8N2,Y24,Y49N102** \
--output-dir /srv/ngi_data/sequencing/NovaSeqXPlus/20251111_LH00202_0295_A235WFLLT3/Demultiplexing_0 \
--sample-sheet /srv/ngi_data/sequencing/NovaSeqXPlus/20251111_LH00202_0295_A235WFLLT3/SampleSheet_0.csv \
--loading-threads 2 \
--processing-threads 12 \
--writing-threads 2 \
--minimum-trimmed-read-length 0 \
--mask-short-adapter-reads 0 \
--ignore-missing-positions \
--ignore-missing-controls \
--ignore-missing-filter \
--ignore-missing-bcls \
**--create-fastq-for-index-reads**
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
  --bcl-only-lane 4
```

### Sample sheet

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
**
BarcodeMismatchesIndex1: 0
CreateFastqForIndexReads,1
TrimUMI,0**

[BCLConvert_Data]
Lane,Sample_ID,Sample_Name,index,index2,Sample_Project,**OverrideCycles**
4,Sample_P36052_101,P36052_101,TCTTAGGC,,A__Berggren_25_03,R1:Y50N101;I1:I8N2;I2:U24;R2:Y49N102
4,Sample_P36052_101,P36052_101,AGCCCTTT,,A__Berggren_25_03,R1:Y50N101;I1:I8N2;I2:U24;R2:Y49N102
4,Sample_P36052_101,P36052_101,CAAGTCCA,,A__Berggren_25_03,R1:Y50N101;I1:I8N2;I2:U24;R2:Y49N102
4,Sample_P36052_101,P36052_101,GTGAGAAG,,A__Berggren_25_03,R1:Y50N101;I1:I8N2;I2:U24;R2:Y49N102
4,Sample_P36052_102,P36052_102,TGCTCTGT,,A__Berggren_25_03,R1:Y50N101;I1:I8N2;I2:U24;R2:Y49N102
4,Sample_P36052_102,P36052_102,AATCACTA,,A__Berggren_25_03,R1:Y50N101;I1:I8N2;I2:U24;R2:Y49N102
4,Sample_P36052_102,P36052_102,CCGAGAAC,,A__Berggren_25_03,R1:Y50N101;I1:I8N2;I2:U24;R2:Y49N102
4,Sample_P36052_102,P36052_102,GTAGTGCG,,A__Berggren_25_03,R1:Y50N101;I1:I8N2;I2:U24;R2:Y49N102
4,Sample_P36052_103,P36052_103,TTAGATTG,,A__Berggren_25_03,R1:Y50N101;I1:I8N2;I2:U24;R2:Y49N102
4,Sample_P36052_103,P36052_103,AAGTTGAT,,A__Berggren_25_03,R1:Y50N101;I1:I8N2;I2:U24;R2:Y49N102
4,Sample_P36052_103,P36052_103,CCCACCCA,,A__Berggren_25_03,R1:Y50N101;I1:I8N2;I2:U24;R2:Y49N102
4,Sample_P36052_103,P36052_103,GGTCGAGC,,A__Berggren_25_03,R1:Y50N101;I1:I8N2;I2:U24;R2:Y49N102
4,Sample_P36052_104,P36052_104,TGTGATGC,,A__Berggren_25_03,R1:Y50N101;I1:I8N2;I2:U24;R2:Y49N102
4,Sample_P36052_104,P36052_104,ACATTCCG,,A__Berggren_25_03,R1:Y50N101;I1:I8N2;I2:U24;R2:Y49N102
4,Sample_P36052_104,P36052_104,CTGCGGTA,,A__Berggren_25_03,R1:Y50N101;I1:I8N2;I2:U24;R2:Y49N102
4,Sample_P36052_104,P36052_104,GACACAAT,,A__Berggren_25_03,R1:Y50N101;I1:I8N2;I2:U24;R2:Y49N102
4,Sample_P36052_201,P36052_201,TCATCAAG,,A__Berggren_25_03,R1:Y50N101;I1:I8N2;I2:U24;R2:Y49N102
4,Sample_P36052_201,P36052_201,AGGCTGGT,,A__Berggren_25_03,R1:Y50N101;I1:I8N2;I2:U24;R2:Y49N102
4,Sample_P36052_201,P36052_201,CACAACTA,,A__Berggren_25_03,R1:Y50N101;I1:I8N2;I2:U24;R2:Y49N102
4,Sample_P36052_201,P36052_201,GTTGGTCC,,A__Berggren_25_03,R1:Y50N101;I1:I8N2;I2:U24;R2:Y49N102

```

# Test case 12 - UMIs: in read [SKIP]

# Test case 13 - UMIs: in index [SKIP]

# Test case 14 - Special and standard indexes on the same lane [SKIP]

# Test case 15 - Single index: index 2 (R3) needs to be reported in fastq file [SKIP]

# Test case 16 - Single index: mixed index length
## Description

- Mixed index length on one lane
- One or multiple projects on the same lane
- No example of this in the last 6 months but it should be similar to “[Mixed dual and single on one lane](https://www.notion.so/Mixed-dual-and-single-on-one-lane-2a7274e6d5168009800ac373d70f4a39?pvs=21)”

## Example data

**Run:** No example found
**Run Setup (Recipe):** 151-10-10-151

**Current bcl2fastq settings:**

### LIMS sample sheet
(made up)

```csv
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
233JTGLT4,1,P36705_101,P36705_101,Human (Homo sapiens GRCh38),GCGCGGTTAA,,A__Berggren_25_01,N,151-151,Agneta_Berg,A__Berggren_25_01
233JTGLT4,1,P36705_102,P36705_102,Human (Homo sapiens GRCh38),TTCCTTGAGG,,A__Berggren_25_01,N,151-151,Agneta_Berg,A__Berggren_25_01
233JTGLT4,1,P37004_1001,P37004_1001,Human (Homo sapiens GRCh38),TCAGCGAA,,A__Bergman_25_01,N,151-151,Agneta_Berg,A__Bergman_25_01
233JTGLT4,1,P37004_1002,P37004_1002,Human (Homo sapiens GRCh38),CCATTGTT,,A__Bergman_25_01,N,151-151,Agneta_Berg,A__Bergman_25_01

```

SampleSheet_0.csv (made up)

```bash
[Header]
[Data]
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
233JTGLT4,1,P36705_101,P36705_101,Human (Homo sapiens GRCh38),GCGCGGTTAA,,A__Berggren_25_01,N,151-151,Agneta_Berg,A__Berggren_25_01
233JTGLT4,1,P36705_102,P36705_102,Human (Homo sapiens GRCh38),TTCCTTGAGG,,A__Berggren_25_01,N,151-151,Agneta_Berg,A__Berggren_25_01
```

SampleSheet_1.csv (made up)

```bash
[Header]
[Data]
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
233JTGLT4,1,P37004_1001,P37004_1001,Human (Homo sapiens GRCh38),TCAGCGAA,,A__Bergman_25_01,N,151-151,Agneta_Berg,A__Bergman_25_01
233JTGLT4,1,P37004_1002,P37004_1002,Human (Homo sapiens GRCh38),CCATTGTT,,A__Bergman_25_01,N,151-151,Agneta_Berg,A__Bergman_25_01

```

bcl2fastq commands (made up):

```bash
bcl2fastq --output-dir /srv/ngi_data/sequencing/NovaSeqXPlus/20251118_LH00202_0299_B233JTGLT4/Demultiplexing_0 \
--sample-sheet /srv/ngi_data/sequencing/NovaSeqXPlus/20251118_LH00202_0299_B233JTGLT4/SampleSheet_0.csv \
--loading-threads 2 \
--processing-threads 12 \
--writing-threads 2 \
--minimum-trimmed-read-length 0 \
--mask-short-adapter-reads 0 \
--ignore-missing-positions \
--ignore-missing-controls \
--ignore-missing-filter \
--ignore-missing-bcls \
**--barcode-mismatches 0**

bcl2fastq **--use-bases-mask 1:Y151,I8N2,N10,Y151** \
--output-dir /srv/ngi_data/sequencing/NovaSeqXPlus/20251118_LH00202_0299_B233JTGLT4/Demultiplexing_1 \
--sample-sheet /srv/ngi_data/sequencing/NovaSeqXPlus/20251118_LH00202_0299_B233JTGLT4/SampleSheet_1.csv \
--loading-threads 2 \
--processing-threads 12 \
--writing-threads 2 \
--minimum-trimmed-read-length 0 \
--mask-short-adapter-reads 0 \
--ignore-missing-positions \
--ignore-missing-controls \
--ignore-missing-filter \
--ignore-missing-bcls \
**--barcode-mismatches 0**
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
  --bcl-only-lane 1
```

### Sample sheet

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
**BarcodeMismatchesIndex1,0**

[BCLConvert_Data]
Lane,Sample_ID,Sample_Name,index,index2,Sample_Project,OverrideCycles,BarcodeMismatchesIndex1
1,Sample_P36705_101,P36705_101,GCGCGGTTAA,,A__Berggren_25_01,R1:Y151;I1:I10;I2:N10;R2:Y151,1
1,Sample_P36705_102,P36705_102,TTCCTTGAGG,,A__Berggren_25_01,R1:Y151;I1:I10;I2:N10;R2:Y151,1
1,Sample_P37004_1001,P37004_1001,TCAGCGAA,,A__Bergman_25_01,R1:Y151;I1:I8N2;I2:N10;R2:Y151,0
1,Sample_P37004_1002,P37004_1002,CCATTGTT,,A__Bergman_25_01,R1:Y151;I1:I8N2;I2:N10;R2:Y151,0

```

# Test case 17 - Single index: sequencing setup was dual index [SKIP]

## Description

- Single index but sequencing setup was dual index
- One demux
- Same as “[Mixed dual and single on one lane](https://www.notion.so/Mixed-dual-and-single-on-one-lane-2a7274e6d5168009800ac373d70f4a39?pvs=21)”

# Test case 18 - Single index: index or read is shorter than the sequencing setup

## Description

- Single index is shorter than the sequencing setup
- One or more projects per lane
- One demux

## Example data

**Run:** [20251118_LH00202_0299_B233JTGLT4](https://genomics-status.scilifelab.se/flowcells/20251118_LH00202_0299_B233JTGLT4)
**Run Setup (Recipe):** 151-10-10-151

**Project(s) and setup:** [A.Berggren_25_02](https://genomics-status.scilifelab.se/project/P37869) (151-X-X-151)

**Current bcl2fastq settings:**

### LIMS sample sheet

```csv
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
...
233JTGLT4,7,P37869_1001,P37869_1001,Other (- -),TTACCGAC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1002,P37869_1002,Other (- -),AGTGACCT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1003,P37869_1003,Other (- -),TCGGATTC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1004,P37869_1004,Other (- -),CAAGGTAC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1005,P37869_1005,Other (- -),TCCTCATG,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1006,P37869_1006,Other (- -),GTCAGTCA,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1007,P37869_1007,Other (- -),CGAATACG,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1008,P37869_1008,Other (- -),TCTAGGAG,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1009,P37869_1009,Other (- -),CGCAACTA,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1010,P37869_1010,Other (- -),CGTATCTC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1011,P37869_1011,Other (- -),GTACACCT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1012,P37869_1012,Other (- -),CGGCATTA,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1013,P37869_1013,Other (- -),TCGTCTGA,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1014,P37869_1014,Other (- -),AGCCTATC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1015,P37869_1015,Other (- -),CTGTACCA,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1016,P37869_1016,Other (- -),AGACCTTG,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1017,P37869_1017,Other (- -),AGGATAGC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1018,P37869_1018,Other (- -),CCTTCCAT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1019,P37869_1019,Other (- -),GTCCTTGA,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1020,P37869_1020,Other (- -),TGCGTAAC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1021,P37869_1021,Other (- -),CACAGACT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1022,P37869_1022,Other (- -),TTACGTGC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1023,P37869_1023,Other (- -),CCAAGGTT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1024,P37869_1024,Other (- -),CACGCAAT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1025,P37869_1025,Other (- -),TTCCAGGT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1026,P37869_1026,Other (- -),TCATCTCC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1027,P37869_1027,Other (- -),GAGAGTAC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1028,P37869_1028,Other (- -),GTCGTTAC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1029,P37869_1029,Other (- -),GGAGGAAT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,P37869_1030,P37869_1030,Other (- -),AGGAACAC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
...
```

SampleSheet_2.csv

```bash
[Header]
[Data]
FCID,Lane,Sample_ID,Sample_Name,Sample_Ref,index,index2,Description,Control,Recipe,Operator,Sample_Project
233JTGLT4,7,Sample_P37869_1001,P37869_1001,Other (- -),TTACCGAC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1002,P37869_1002,Other (- -),AGTGACCT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1003,P37869_1003,Other (- -),TCGGATTC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1004,P37869_1004,Other (- -),CAAGGTAC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1005,P37869_1005,Other (- -),TCCTCATG,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1006,P37869_1006,Other (- -),GTCAGTCA,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1007,P37869_1007,Other (- -),CGAATACG,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1008,P37869_1008,Other (- -),TCTAGGAG,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1009,P37869_1009,Other (- -),CGCAACTA,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1010,P37869_1010,Other (- -),CGTATCTC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1011,P37869_1011,Other (- -),GTACACCT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1012,P37869_1012,Other (- -),CGGCATTA,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1013,P37869_1013,Other (- -),TCGTCTGA,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1014,P37869_1014,Other (- -),AGCCTATC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1015,P37869_1015,Other (- -),CTGTACCA,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1016,P37869_1016,Other (- -),AGACCTTG,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1017,P37869_1017,Other (- -),AGGATAGC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1018,P37869_1018,Other (- -),CCTTCCAT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1019,P37869_1019,Other (- -),GTCCTTGA,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1020,P37869_1020,Other (- -),TGCGTAAC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1021,P37869_1021,Other (- -),CACAGACT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1022,P37869_1022,Other (- -),TTACGTGC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1023,P37869_1023,Other (- -),CCAAGGTT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1024,P37869_1024,Other (- -),CACGCAAT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1025,P37869_1025,Other (- -),TTCCAGGT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1026,P37869_1026,Other (- -),TCATCTCC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1027,P37869_1027,Other (- -),GAGAGTAC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1028,P37869_1028,Other (- -),GTCGTTAC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1029,P37869_1029,Other (- -),GGAGGAAT,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
233JTGLT4,7,Sample_P37869_1030,P37869_1030,Other (- -),AGGAACAC,,A__Berggren_25_02,N,151-151,Agneta_Berg,A__Berggren_25_02
```

bcl2fastq command:

```bash
bcl2fastq --use-bases-mask 1:Y151,I8N2,N10,Y151 \
--use-bases-mask 7:Y151,I8N2,N10,Y151 \
--output-dir /srv/ngi_data/sequencing/NovaSeqXPlus/20251118_LH00202_0299_B233JTGLT4/Demultiplexing_2 \
--sample-sheet /srv/ngi_data/sequencing/NovaSeqXPlus/20251118_LH00202_0299_B233JTGLT4/SampleSheet_2.csv \
--loading-threads 2 \
--processing-threads 12 \
--writing-threads 2 \
--minimum-trimmed-read-length 0 \
--mask-short-adapter-reads 0 \
--ignore-missing-positions \
--ignore-missing-controls \
--ignore-missing-filter \
--ignore-missing-bcls \
--barcode-mismatches 0
```

## Suggestions

### bclconvert command

```bash
bcl-convert \
  --bcl-input-directory /path/to/RunFolder \
  --output-directory Demux_lane7_sub0 \
  --sample-sheet SampleSheet_lane_7_sub0.csv \
  --bcl-sampleproject-subdirectories true \
  --sample-name-column-enabled true \
  --bcl-only-lane 7
```

### Sample sheet

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
**BarcodeMismatchesIndex1,0**

[BCLConvert_Data]
Lane,Sample_ID,Sample_Name,index,index2,Sample_Project,OverrideCycles
7,Sample_P37869_1001,P37869_1001,TTACCGAC,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1002,P37869_1002,AGTGACCT,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1003,P37869_1003,TCGGATTC,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1004,P37869_1004,CAAGGTAC,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1005,P37869_1005,TCCTCATG,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1006,P37869_1006,GTCAGTCA,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1007,P37869_1007,CGAATACG,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1008,P37869_1008,TCTAGGAG,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1009,P37869_1009,CGCAACTA,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1010,P37869_1010,CGTATCTC,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1011,P37869_1011,GTACACCT,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1012,P37869_1012,CGGCATTA,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1013,P37869_1013,TCGTCTGA,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1014,P37869_1014,AGCCTATC,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1015,P37869_1015,CTGTACCA,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1016,P37869_1016,AGACCTTG,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1017,P37869_1017,AGGATAGC,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1018,P37869_1018,CCTTCCAT,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1019,P37869_1019,GTCCTTGA,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1020,P37869_1020,TGCGTAAC,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1021,P37869_1021,CACAGACT,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1022,P37869_1022,TTACGTGC,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1023,P37869_1023,CCAAGGTT,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1024,P37869_1024,CACGCAAT,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1025,P37869_1025,TTCCAGGT,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1026,P37869_1026,TCATCTCC,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1027,P37869_1027,GAGAGTAC,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1028,P37869_1028,GTCGTTAC,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1029,P37869_1029,GGAGGAAT,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
7,Sample_P37869_1030,P37869_1030,AGGAACAC,,A__Berggren_25_02,R1:Y151;I1:I8N2;I2:N10;R2:Y151
```