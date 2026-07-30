package com.mxailabs.mtalk;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(KidLockPlugin.class);
        super.onCreate(savedInstanceState);
        // The WebView can only grant getUserMedia (voice recording for custom
        // tiles) when the app itself holds RECORD_AUDIO, so ask once up front.
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                    this, new String[] { Manifest.permission.RECORD_AUDIO }, 1001);
        }
    }
}
