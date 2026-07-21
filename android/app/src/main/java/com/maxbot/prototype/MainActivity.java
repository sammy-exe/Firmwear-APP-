package com.maxbot.prototype;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private ConnectivityManager connectivityManager;
    private ConnectivityManager.NetworkCallback networkCallback;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        bindToWifi();
    }

    private void bindToWifi() {
        connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);

        NetworkRequest request = new NetworkRequest.Builder()
            .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
            .build();

        networkCallback = new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(Network network) {
                // Force ALL app traffic through WiFi — ignores mobile data
                connectivityManager.bindProcessToNetwork(network);
            }

            @Override
            public void onLost(Network network) {
                // Release binding when WiFi lost
                connectivityManager.bindProcessToNetwork(null);
            }
        };

        connectivityManager.requestNetwork(request, networkCallback);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (connectivityManager != null && networkCallback != null) {
            connectivityManager.unregisterNetworkCallback(networkCallback);
            connectivityManager.bindProcessToNetwork(null);
        }
    }
}
