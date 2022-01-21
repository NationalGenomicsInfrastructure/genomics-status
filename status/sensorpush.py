"""Set of handlers related with Sensorpush data
"""

import json
import datetime

from status.util import SafeHandler

class SensorpushBaseHandler(SafeHandler):
    def get_samples(self):
        """TODO: Should be able to take a start date parameter"""


        # A reasonable start time
        start_time = datetime.datetime.now() - datetime.timedelta(weeks=4)
        start_time_str = start_time.strftime('%Y-%m-%dT00:00:00')

        # Fetch all sensor names from the update two days ago
        # this would be the most recent update that is "guaranteed" to be there.
        # Could be failing if the script has been failing, go back 2 days at a time to find it.
        two_days_ago = datetime.datetime.now() - datetime.timedelta(days=2)
        while two_days_ago > start_time:
            sensor_id_view = self.application.sensorpush_db.view('sensor_id/by_date', descending=True)
            sensors = [row.value for row in sensor_id_view[two_days_ago.strftime('%Y-%m-%dT00:00:00')]]
            if sensors == []:
                two_days_ago -= datetime.timedelta(days=2)
            else:
                break

        # Fetch samples from 1 month ago for each sensor
        samples_view = self.application.sensorpush_db.view('entire_document/by_sensor_id_and_date')
        sensor_data = {}
        for sensor_original in sorted(sensors):
            # Make it more suitable to use as a selector.
            sensor = sensor_original.replace('.', '_')
            sensor_data[sensor] = {
                                    'samples': [],
                                    'min_temp': 800,
                                    'max_temp': -300,
                                    'limit_lower': [],
                                    'min_limit_lower': 800,
                                    'limit_upper': [],
                                    'max_limit_upper': -300,
                                    'intervals_lower': [],
                                    'intervals_higher': []
                                   }
            for sensor_daily_row in samples_view[[sensor_original, start_time_str]:[sensor_original, '9999']]:
                _, timestamp = sensor_daily_row.key
                doc = sensor_daily_row.value
                sensor_data[sensor]['samples'] += doc['saved_samples']
                sensor_data[sensor]['intervals_lower'] += doc['intervals_lower']
                sensor_data[sensor]['intervals_higher'] += doc['intervals_higher']
                sensor_data[sensor]['sensor_name'] = doc['sensor_name']

                min_val = 800
                max_val = -300
                for _, temp_val in doc['saved_samples']:
                    min_val = min(min_val, temp_val)
                    max_val = max(max_val, temp_val)
                sensor_data[sensor]['min_temp'] = min(sensor_data[sensor]['min_temp'], min_val)
                sensor_data[sensor]['max_temp'] = max(sensor_data[sensor]['max_temp'], max_val)

                sensor_data[sensor]['limit_lower'].append([timestamp, doc['limit_lower']])
                sensor_data[sensor]['limit_upper'].append([timestamp, doc['limit_upper']])
                if doc['limit_lower'] is not None:
                    sensor_data[sensor]['min_limit_lower'] = min(sensor_data[sensor]['min_limit_lower'], doc['limit_lower'])
                if doc['limit_upper'] is not None:
                    sensor_data[sensor]['max_limit_upper'] = max(sensor_data[sensor]['max_limit_upper'], doc['limit_upper'])

            if sensor_data[sensor]['max_limit_upper'] == -300:
                sensor_data[sensor]['max_limit_upper'] = None

            if sensor_data[sensor]['min_limit_lower'] == 800:
                sensor_data[sensor]['min_limit_lower'] = None

        return sensor_data

class SensorpushDataHandler(SensorpushBaseHandler):
    """ Serves datapoints for last month of sensorpush temperatures """

    def get(self):
        sensor_data = self.get_samples()
        self.write(json.dumps(sensor_data))


class SensorpushHandler(SensorpushBaseHandler):
    """ Serves a page which lists all sensors with temperature info.
    """

    def get(self):
        sensor_data = self.get_samples()

        t = self.application.loader.load("sensorpush.html")
        self.write(t.generate(gs_globals=self.application.gs_globals, user=self.get_current_user(), sensor_data=sensor_data))