package com.mxailabs.mtalk;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Kid lock: pins MTalk to the screen (Android lock task / screen pinning) so a
 * child cannot switch to other apps. Parents unlock from the gated settings
 * screen, or with the system unpin gesture.
 */
@CapacitorPlugin(name = "KidLock")
public class KidLockPlugin extends Plugin {

    @PluginMethod
    public void lock(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                getActivity().startLockTask();
                call.resolve();
            } catch (Exception e) {
                call.reject("lock failed", e);
            }
        });
    }

    @PluginMethod
    public void unlock(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                getActivity().stopLockTask();
                call.resolve();
            } catch (Exception e) {
                call.reject("unlock failed", e);
            }
        });
    }
}
