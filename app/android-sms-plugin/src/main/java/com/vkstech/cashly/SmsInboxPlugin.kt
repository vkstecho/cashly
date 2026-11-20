package com.vkstech.cashly

import android.Manifest
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import android.provider.Telephony
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

/**
 * Capacitor plugin: read device SMS inbox (Android only).
 * Register in MainActivity:
 *   registerPlugin(SmsInboxPlugin::class.java)
 *
 * Required permission in AndroidManifest.xml:
 *   <uses-permission android:name="android.permission.READ_SMS" />
 */
@CapacitorPlugin(
    name = "SmsInbox",
    permissions = [
        Permission(strings = [Manifest.permission.READ_SMS], alias = "sms")
    ]
)
class SmsInboxPlugin : Plugin() {

    @PluginMethod
    fun checkPermission(call: PluginCall) {
        val granted = ContextCompat.checkSelfPermission(
            context, Manifest.permission.READ_SMS
        ) == PackageManager.PERMISSION_GRANTED
        val ret = JSObject()
        ret.put("status", if (granted) "granted" else "prompt")
        call.resolve(ret)
    }

    @PluginMethod
    fun requestPermission(call: PluginCall) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS)
            == PackageManager.PERMISSION_GRANTED
        ) {
            val ret = JSObject()
            ret.put("status", "granted")
            call.resolve(ret)
            return
        }
        requestPermissionForAlias("sms", call, "onSmsPerm")
    }

    @PermissionCallback
    private fun onSmsPerm(call: PluginCall) {
        val granted = ContextCompat.checkSelfPermission(
            context, Manifest.permission.READ_SMS
        ) == PackageManager.PERMISSION_GRANTED
        val ret = JSObject()
        ret.put("status", if (granted) "granted" else "denied")
        call.resolve(ret)
    }

    @PluginMethod
    fun read(call: PluginCall) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS)
            != PackageManager.PERMISSION_GRANTED
        ) {
            call.reject("SMS permission not granted")
            return
        }

        val max = call.getInt("max") ?: 50
        val bodyContains = call.getString("bodyContains")

        val messages = JSArray()
        val uri: Uri = Telephony.Sms.Inbox.CONTENT_URI
        val projection = arrayOf(
            Telephony.Sms.BODY,
            Telephony.Sms.ADDRESS,
            Telephony.Sms.DATE
        )
        val sort = Telephony.Sms.DEFAULT_SORT_ORDER // date DESC

        var cursor: Cursor? = null
        try {
            cursor = context.contentResolver.query(uri, projection, null, null, sort)
            if (cursor != null) {
                var count = 0
                val bodyIdx = cursor.getColumnIndex(Telephony.Sms.BODY)
                val addrIdx = cursor.getColumnIndex(Telephony.Sms.ADDRESS)
                val dateIdx = cursor.getColumnIndex(Telephony.Sms.DATE)
                while (cursor.moveToNext() && count < max) {
                    val body = if (bodyIdx >= 0) cursor.getString(bodyIdx) ?: "" else ""
                    if (!bodyContains.isNullOrEmpty() &&
                        !body.contains(bodyContains, ignoreCase = true)
                    ) {
                        continue
                    }
                    val obj = JSObject()
                    obj.put("body", body)
                    obj.put("address", if (addrIdx >= 0) cursor.getString(addrIdx) else "")
                    obj.put("date", if (dateIdx >= 0) cursor.getLong(dateIdx) else 0L)
                    messages.put(obj)
                    count++
                }
            }
        } catch (e: Exception) {
            call.reject("Failed to read SMS: ${e.message}", e)
            return
        } finally {
            cursor?.close()
        }

        val ret = JSObject()
        ret.put("messages", messages)
        call.resolve(ret)
    }
}
