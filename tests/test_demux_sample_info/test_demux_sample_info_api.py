"""
Test script for the demux sample info POST API endpoint.

This demonstrates how to POST data to /api/v1/demux_sample_info/<flowcell_id>
"""

import json

import requests

# Example data matching the structure from sample_info_demux_1.json
post_data = {
    "metadata": {
        "num_lanes": 2,
        "run_setup": "2x151",
        "setup_lims_step_id": "24-123456",
    },
    "uploaded_info": [
        {
            "flowcell_id": "233KCWLT4",
            "lane": "3",
            "sample_id": "P71234_504",
            "sample_name": "P71234_504",
            "sample_ref": "Human (Homo sapiens GRCh38)",
            "index": "SI-TS-D7",
            "index2": "",
            "description": "Y__Andersson_01_45",
            "control": "N",
            "recipe": "43-8-10-50",
            "operator": "Lars_Eriksson",
            "sample_project": "Y__Andersson_01_45",
        },
        {
            "flowcell_id": "233KCWLT4",
            "lane": "3",
            "sample_id": "P71234_502",
            "sample_name": "P71234_502",
            "sample_ref": "Human (Homo sapiens GRCh38)",
            "index": "SI-TS-B7",
            "index2": "",
            "description": "Y__Andersson_01_45",
            "control": "N",
            "recipe": "43-8-10-50",
            "operator": "Lars_Eriksson",
            "sample_project": "Y__Andersson_01_45",
        },
        {
            "flowcell_id": "233KCWLT4",
            "lane": "6",
            "sample_id": "P89101_2001",
            "sample_name": "P89101_2001",
            "sample_ref": "Human (Homo sapiens GRCh38)",
            "index": "CGCCTCT",
            "index2": "CGTTCCT",
            "description": "B__Svensson_12_34",
            "control": "N",
            "recipe": "151-10-10-151",
            "operator": "Mikael_Johansson",
            "sample_project": "B__Svensson_12_34",
        },
    ],
}


def test_post_demux_sample_info(
    base_url="http://localhost:8888", flowcell_id="233KCWLT4"
):
    """
    Test the POST endpoint for demux sample info data.

    Args:
        base_url: Base URL of the application
        flowcell_id: Flowcell ID to use in the URL
    """
    url = f"{base_url}/api/v1/demux_sample_info/{flowcell_id}"

    print(f"Posting to: {url}")
    print(f"Data: {json.dumps(post_data, indent=2)}\n")

    try:
        response = requests.post(
            url, json=post_data, headers={"Content-Type": "application/json"}
        )

        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        if response.status_code == 201:
            print("\n✓ Success! Demux sample info data was accepted.")
        else:
            print(f"\n✗ Error: {response.status_code}")

    except requests.exceptions.ConnectionError:
        print(f"✗ Could not connect to {base_url}")
        print("  Make sure the application is running.")
    except Exception as e:
        print(f"✗ Error: {e}")


if __name__ == "__main__":
    # Run the test
    test_post_demux_sample_info()
