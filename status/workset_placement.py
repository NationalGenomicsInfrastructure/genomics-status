
from status.util import dthandler, SafeHandler
from genologics.entities import Process, Step
from genologics import lims
from genologics.config import BASEURI, USERNAME, PASSWORD


import numpy
import json

class WorksetPlacementHandler(SafeHandler):
    def get(self):
        t = self.application.loader.load("workset_placement.html")
        self.write(t.generate(gs_globals=self.application.gs_globals))

class WorksetSampleLoadHandler(SafeHandler):

    def get(self):
        data={}
        lims_url=self.request.query
        lims_id="24-{}".format(lims_url.split("/")[-1])
        mylims = lims.Lims(BASEURI, USERNAME, PASSWORD)
        p=Process(mylims, id=lims_id)
        data['comments']={}
        data['samples']={}
        for i in p.all_inputs():
            sample_name=i.samples[0].name
            if not i.samples[0].project:
                continue
            else:
                project=i.samples[0].project
            if 'Project Comment' in project.udf and project.id not in data['comments']:
                data['comments'][project.id]=project.udf['Project Comment']
            data['samples'][sample_name]={}
            data['samples'][sample_name]['amount']=i.udf['Amount (ng)']
            data['samples'][sample_name]['previous_preps']={}
            if 'Library construction method' in project.udf:
                data['samples'][sample_name]['lib_method']=project.udf['Library construction method']
            if 'Sequencing platform' in project.udf:
                data['samples'][sample_name]['seq_pl']=project.udf['Sequencing platform']
            other_preps=mylims.get_processes(inputartifactlimsid=i.id, type="Setup Workset/Plate")
            for op in other_preps:
                if op.id != p.id:
                    for o in op.all_outputs():
                        if o.type=="Analyte" and o.samples[0].name==sample_name:
                            data['samples'][sample_name]['previous_preps'][o.location[0].name]={}
                            data['samples'][sample_name]['previous_preps'][o.location[0].name]['position']=o.location[1]
                            data['samples'][sample_name]['previous_preps'][o.location[0].name]['amount']=o.udf['Amount taken (ng)']


        self.set_header("Content-type", "application/json")
        self.write(json.dumps(data))


class GenerateWorksetHandler(SafeHandler):
    def post(self):
        data=json.loads(self.request.body)
        ws=Workset_Setup(data['pools']['hiseqx'],data['pools']['hiseq'], data['rules'])
        ws.setup()
        result=ws.mat
        self.set_header("Content-type", "application/json")
        self.write(json.dumps(result))


class WorksetPlacementSavingHandler(SafeHandler):
    def post(self):
        data=json.loads(self.request.body)
        print data
        mylims = lims.Lims(BASEURI, USERNAME, PASSWORD)
        lims_id="24-{}".format(data['lims_url'].split("/")[-1])
        st=Step(mylims, id=lims_id)
        cont=st.placements.selected_containers[0]
        pll=st.placements.placement_list
        for artl in pll:
            sample=artl[0].samples[0].name
            for row_idx in xrange(0, len(data['mat'])):
                for col_idx in xrange(0, len(data['mat'][row_idx])):
                    if data['mat'][row_idx][col_idx] == sample:
                        location=(cont,"{}:{}".format(chr(row_idx+65), col_idx+1))
                        artl[1]=location

        st.placements.placement_list=pll
        st.placements.post()
        self.set_header("Content-type", "application/json")
        self.write(json.dumps({'status':'ok'}))

class Workset_Setup():
    #This uses a list of rows as a model
    def __init__(self, HXp, Hsp, rules=""):
        self.mat=numpy.zeros(shape=[8,12]).tolist()
        self.hiseqx_pools=HXp
        self.hiseq_pools=Hsp
        self.streams=[[-1,1],[-1,0]]
        self.rules=rules
        self.placed=[]

        if (len(self.hiseqx_pools) + len(self.hiseq_pools))>96:
            raise Exception("Too many samples")


    def setup(self):
        self.place_rules()
        self.pretty_print()
        self.place_X()
        self.place_hiseq()
        self.post_process()
        self.pretty_print()


    def place_sample(self, sample, position):
        self.mat[position[0]][position[1]]=sample
        self.placed.append(sample)


    def remove_sample_from_pools(self, sample):
        for hsp in self.hiseq_pools:
            try:
                hsp.remove(sample)
            except:
                pass
        for hxp in self.hiseqx_pools:
            try:
                hxp.remove(sample)
            except:
                pass

        
    def place_rules(self):
        for rule in self.rules.split():
            sample=rule.split("@")[0]
            positions=rule.split("@")[1].split(':')
            positions[0]=ord(positions[0])-65
            positions[1]=int(positions[1])-1
            self.place_sample(sample, positions)
            self.remove_sample_from_pools(sample)


    def place_hiseq(self):
        stream=0
        for pool in self.hiseq_pools:
            for sample in pool:
                 if sample not in self.placed:
                     self.update_next_position(stream);
                     self.place_sample(sample, self.streams[stream])

            stream=(stream+1)%2




    def place_X(self):
        for pool in self.hiseqx_pools:
            success=False
            for row in xrange(7,-1,-1):
                success=self.fit_pool_in_row(pool, row)
                if success:
                    break
            self.pretty_print()

    def fit_pool_in_row(self, pool, row):
        fitted=False
        start=-1
        c_count=0;
        previous=-1;
        for col_id in xrange(0, len(self.mat[row])):
            if self.mat[row][col_id]==0:
                c_count+=1
                if start == -1:
                    start=col_id
                if previous==0:
                    if len(pool)<=c_count:
                        for s_idx in xrange(0, len(pool)):
                            self.mat[row][start+s_idx]=pool[s_idx]
                        fitted=True
                        break
            else:
                start=-1
                c_count=0
            previous=self.mat[row][col_id]

        return fitted


    def update_next_position(self, stream_idx):
        new_pos=[-1, -1]
        if self.streams[stream_idx][1]%2:
            new_pos[1]=self.streams[stream_idx][1]-1
        else:
            new_pos[1]=self.streams[stream_idx][1]+1
        new_pos[0]=self.streams[stream_idx][0]+1
        if new_pos[0]>7:
            new_pos[1]+=2
            new_pos[0]=0

        if new_pos[1]>11:
            new_pos=self.streams[(stream_idx+1)%2]
        self.streams[stream_idx]=new_pos
        if self.mat[new_pos[0]][new_pos[1]]!= 0:
            self.update_next_position(stream_idx)

    def post_process(self):
        for i in xrange(0, len(self.mat)):
            for j in xrange(0, len(self.mat[i])):
                if not self.mat[i][j]:
                    self.mat[i][j]=''


    def pretty_print(self):
        text=""
        for x in self.mat:
            for y in x:
                text+="\t{}".format(y)

            text+="\n"
        print text

if __name__=="__main__":
    data={u'rules': u' P3759_227@C:7 P4113_210@G:7', u'pools': {u'hiseq': [[u'P3759_227'], [u'P4113_210'], [u'P4256_101', u'P4256_102', u'P4256_103', u'P4256_104', u'P4256_105', u'P4256_106', u'P4256_107', u'P4256_108', u'P4256_109', u'P4256_110', u'P4256_111', u'P4256_112'], [u'P4501_101', u'P4501_102', u'P4501_103', u'P4501_104', u'P4501_105', u'P4501_106', u'P4501_107', u'P4501_108'], [u'P4505_101', u'P4505_102', u'P4505_103', u'P4505_104', u'P4505_105', u'P4505_106', u'P4505_107', u'P4505_108', u'P4505_109', u'P4505_110', u'P4505_111', u'P4505_112', u'P4505_113', u'P4505_114', u'P4505_115', u'P4505_116', u'P4505_117', u'P4505_118', u'P4505_119', u'P4505_120', u'P4505_121', u'P4505_122', u'P4505_123', u'P4505_124', u'P4505_125', u'P4505_126', u'P4505_127', u'P4505_128', u'P4505_129', u'P4505_130', u'P4505_131', u'P4505_132', u'P4505_133', u'P4505_134', u'P4505_135', u'P4505_136', u'P4505_137', u'P4505_138', u'P4505_139', u'P4505_140', u'P4505_141', u'P4505_142', u'P4505_143', u'P4505_144', u'P4505_145', u'P4505_146', u'P4505_147', u'P4505_148'], [u'P4554_101', u'P4554_102', u'P4554_103', u'P4554_109', u'P4554_110', u'P4554_111', u'P4554_117', u'P4554_118', u'P4554_119', u'P4554_125', u'P4554_126', u'P4554_127'], [u'P4802_101', u'P4802_102', u'P4802_103', u'P4802_104', u'P4802_105', u'P4802_106', u'P4802_107', u'P4802_108', u'P4802_109', u'P4802_110', u'P4802_111', u'P4802_112']], u'hiseqx': []}}
    ws=Workset_Setup(data['pools']['hiseqx'],data['pools']['hiseq'], data['rules'])
    ws.setup()
